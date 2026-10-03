import re
from typing import Any, Dict, List, Optional
from app.automation.base import BaseApplicationAdapter, FormField, FieldMappingResult
from app.schemas.profile import ProfileBase

CAPTCHA_PATTERNS = [
    r"recaptcha",
    r"hcaptcha",
    r"cf-turnstile",
    r"cloudflare",
    r"verify you are human",
    r"security check",
    r"bot detection",
]


class GenericFormAdapter(BaseApplicationAdapter):
    """Universal form adapter that dynamically inspects HTML forms and fills inputs via profile mappings."""

    async def detect(self, page_content: str, url: str) -> bool:
        # Generic fallback adapter matches any standard web page
        return True

    def check_for_captcha_or_challenge(self, page_content: str) -> Optional[str]:
        """Detect presence of CAPTCHA or anti-bot verification challenges."""
        content_lower = page_content.lower()
        for pattern in CAPTCHA_PATTERNS:
            if re.search(pattern, content_lower):
                return f"Human verification / CAPTCHA challenge detected matching '{pattern}'."
        return None

    async def extract_fields(self, page: Any) -> List[FormField]:
        """Inspect the Playwright page DOM and extract all interactive form fields."""
        fields: List[FormField] = []
        try:
            # Query all inputs, selects, and textareas
            elements = await page.query_selector_all("input, select, textarea")
            for idx, el in enumerate(elements):
                tag = await el.evaluate("node => node.tagName.toLowerCase()")
                input_type = await el.get_attribute("type") or ("text" if tag == "input" else tag)
                if input_type in ["hidden", "submit", "button", "reset"]:
                    continue

                name = await el.get_attribute("name") or ""
                elem_id = await el.get_attribute("id") or name or f"field_{idx}"
                placeholder = await el.get_attribute("placeholder") or ""
                required = await el.get_attribute("required") is not None


                # Locate associated label text
                label = ""
                if elem_id:
                    lbl = await page.query_selector(f"label[for='{elem_id}']")
                    if lbl:
                        label = (await lbl.inner_text()).strip()

                if not label and placeholder:
                    label = placeholder
                if not label and name:
                    label = name

                options: List[str] = []
                if tag == "select":
                    opt_elements = await el.query_selector_all("option")
                    for opt in opt_elements:
                        val = await opt.get_attribute("value") or await opt.inner_text()
                        if val.strip():
                            options.append(val.strip())

                fields.append(
                    FormField(
                        field_id=elem_id,
                        name=name,
                        label=label,
                        tag=tag,
                        input_type=input_type,
                        is_required=required,
                        options=options,
                    )
                )
        except Exception:
            pass

        return fields

    def map_fields(
        self,
        fields: List[FormField],
        profile: ProfileBase,
        user_name: Optional[str] = None,
        user_email: Optional[str] = None,
        answers: Optional[Dict[str, Any]] = None,
        resume_path: Optional[str] = None,
    ) -> List[FieldMappingResult]:
        """Deterministically maps extracted form fields to candidate profile and prepared answers."""
        answers = answers or {}
        results: List[FieldMappingResult] = []

        full_name = user_name or ""
        first_name = full_name.split()[0] if full_name else ""
        last_name = " ".join(full_name.split()[1:]) if len(full_name.split()) > 1 else ""

        for f in fields:
            hint = f"{f.field_id} {f.name} {f.label}".lower()
            res = FieldMappingResult(field_id=f.field_id, name=f.name)

            # 1. Resume / CV upload
            if f.input_type == "file" or "resume" in hint or "cv" in hint:
                res.target_profile_path = "resume.file_path"
                res.mapped_value = resume_path
                res.requires_human_review = resume_path is None
                results.append(res)
                continue

            # 2. First name / Given name
            if any(k in hint for k in ["first name", "firstname", "fname", "given name"]):
                res.target_profile_path = "user.first_name"
                res.mapped_value = first_name
                results.append(res)
                continue

            # 3. Last name / Surname
            if any(k in hint for k in ["last name", "lastname", "lname", "surname"]):
                res.target_profile_path = "user.last_name"
                res.mapped_value = last_name
                results.append(res)
                continue

            # 4. Full name
            if any(k in hint for k in ["full name", "fullname", "name"]):
                res.target_profile_path = "user.full_name"
                res.mapped_value = full_name
                results.append(res)
                continue

            # 5. Email
            if f.input_type == "email" or any(k in hint for k in ["email", "e-mail"]):
                res.target_profile_path = "user.email"
                res.mapped_value = user_email
                results.append(res)
                continue

            # 6. Phone
            if f.input_type == "tel" or any(k in hint for k in ["phone", "mobile", "contact number"]):
                res.target_profile_path = "profile.phone"
                res.mapped_value = profile.phone or ""
                results.append(res)
                continue

            # 7. LinkedIn
            if "linkedin" in hint:
                res.target_profile_path = "profile.linkedin_url"
                res.mapped_value = profile.linkedin_url or ""
                results.append(res)
                continue

            # 8. GitHub
            if "github" in hint:
                res.target_profile_path = "profile.github_url"
                res.mapped_value = profile.github_url or ""
                results.append(res)
                continue

            # 9. Portfolio / Website
            if any(k in hint for k in ["portfolio", "website", "personal site", "url"]):
                res.target_profile_path = "profile.portfolio_url"
                res.mapped_value = profile.portfolio_url or ""
                results.append(res)
                continue

            # 10. Location / City
            if any(k in hint for k in ["city", "location", "address"]):
                res.target_profile_path = "profile.location"
                res.mapped_value = profile.location or ""
                results.append(res)
                continue

            # 11. Years of experience
            if "experience" in hint and any(k in hint for k in ["years", "total"]):
                res.target_profile_path = "profile.experience_years"
                res.mapped_value = f"{profile.experience_years:.0f}"
                results.append(res)
                continue

            # 12. Work authorization
            if any(k in hint for k in ["authorized to work", "work authorization", "legally authorized", "authorization"]):
                res.target_profile_path = "profile.work_authorization.authorized_in_us"
                auth_val = profile.work_authorization.get("authorized_in_us", profile.work_authorization.get("authorized", True))
                res.mapped_value = "Yes" if auth_val else "No"
                results.append(res)
                continue

            # 13. Visa sponsorship
            if any(k in hint for k in ["sponsorship", "visa sponsor", "require visa"]):
                res.target_profile_path = "profile.work_authorization.requires_sponsorship"
                spon_val = profile.work_authorization.get("requires_sponsorship", False)
                res.mapped_value = "Yes" if spon_val else "No"
                results.append(res)
                continue

            # 14. Notice period / Start date
            if any(k in hint for k in ["notice period", "start date", "availability"]):
                res.target_profile_path = "profile.application_answers.notice_period"
                res.mapped_value = profile.application_answers.get("notice_period", "Immediate")
                results.append(res)
                continue

            # 15. Relocation
            if any(k in hint for k in ["relocate", "relocation"]):
                res.target_profile_path = "profile.application_answers.willing_to_relocate"
                res.mapped_value = profile.application_answers.get("willing_to_relocate", "Yes")
                results.append(res)
                continue

            # 16. Salary expectation
            if any(k in hint for k in ["salary", "compensation"]):
                res.target_profile_path = "profile.preferences.minimum_salary"
                sal_val = profile.preferences.get("minimum_salary")
                res.mapped_value = str(int(sal_val)) if sal_val else "Competitive"
                results.append(res)
                continue

            # 17. Check prepared answers dictionary (e.g. screening questions)
            matched_answer = None
            for q_key, ans_val in answers.items():
                if q_key.lower() in hint or hint in q_key.lower():
                    matched_answer = ans_val
                    break

            if matched_answer is not None:
                res.target_profile_path = "application.answers"
                res.mapped_value = matched_answer
                results.append(res)
            else:
                # Ambiguous or custom field requires review
                res.requires_human_review = True
                res.reason = f"Unmapped field '{f.label or f.name}' requires candidate review."
                results.append(res)

        return results

    async def fill_fields(self, page: Any, mappings: List[FieldMappingResult]) -> Dict[str, Any]:
        """Execute automated field population on the target Playwright page."""
        filled_count = 0
        skipped_count = 0
        review_count = 0

        for m in mappings:
            if m.requires_human_review or m.mapped_value is None:
                review_count += 1
                continue

            try:
                # Try finding element by ID first, then by name
                selector = f"#{m.field_id}"
                el = await page.query_selector(selector)
                if not el:
                    selector = f"[name='{m.field_id}']"
                    el = await page.query_selector(selector)
                if not el and m.name:
                    selector = f"[name='{m.name}']"
                    el = await page.query_selector(selector)


                if el:
                    tag = await el.evaluate("node => node.tagName.toLowerCase()")
                    input_type = await el.get_attribute("type") or ""

                    if input_type == "file":
                        # Set input files for resume upload
                        await el.set_input_files(str(m.mapped_value))
                        filled_count += 1
                    elif tag == "select":
                        # Select option matching value
                        await el.select_option(value=str(m.mapped_value))
                        filled_count += 1
                    elif input_type in ["checkbox", "radio"]:
                        if str(m.mapped_value).lower() in ["true", "yes", "1"]:
                            await el.check()
                        filled_count += 1
                    else:
                        # Text, email, tel, textarea
                        await el.fill(str(m.mapped_value))
                        filled_count += 1
                else:
                    skipped_count += 1
            except Exception:
                skipped_count += 1

        return {
            "filled_count": filled_count,
            "skipped_count": skipped_count,
            "review_count": review_count,
            "review_required": review_count,
        }
