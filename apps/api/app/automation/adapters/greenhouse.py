import re
from typing import Any, Dict, List, Optional
from app.automation.base import BaseApplicationAdapter, FormField, FieldMappingResult
from app.schemas.profile import ProfileBase


class GreenhouseAdapter(BaseApplicationAdapter):
    """Specialized adapter for Greenhouse job application boards (boards.greenhouse.io)."""

    async def detect(self, page_content: str, url: str) -> bool:
        url_lower = url.lower()
        if "greenhouse.io" in url_lower or "grnh.se" in url_lower:
            return True
        return "id=\"application_form\"" in page_content or "greenhouse" in page_content.lower()

    async def extract_fields(self, page: Any) -> List[FormField]:
        fields: List[FormField] = []
        try:
            inputs = await page.query_selector_all("form#application_form input, form#application_form textarea, form#application_form select")
            for idx, el in enumerate(inputs):
                tag = await el.evaluate("node => node.tagName.toLowerCase()")
                input_type = await el.get_attribute("type") or ("text" if tag == "input" else tag)
                if input_type in ["hidden", "submit", "button"]:
                    continue

                name = await el.get_attribute("name") or ""
                elem_id = await el.get_attribute("id") or name or f"gh_{idx}"
                placeholder = await el.get_attribute("placeholder") or ""
                required = await el.get_attribute("required") is not None or "required" in (await el.get_attribute("class") or "")

                label = ""
                if elem_id:
                    lbl = await page.query_selector(f"label[for='{elem_id}']")
                    if lbl:
                        label = (await lbl.inner_text()).strip()
                if not label:
                    label = placeholder or name

                fields.append(
                    FormField(
                        field_id=elem_id,
                        name=name,
                        label=label,
                        tag=tag,
                        input_type=input_type,
                        is_required=required,
                    )
                )
        except Exception:
            pass
        return fields

    async def fill_fields(self, page: Any, mappings: List[FieldMappingResult]) -> Dict[str, Any]:
        filled = 0
        review = 0
        for m in mappings:
            if m.requires_human_review or m.mapped_value is None:
                review += 1
                continue

            try:
                selector = f"#{m.field_id}" if not m.field_id.startswith("#") else m.field_id
                el = await page.query_selector(selector)
                if not el and m.name:
                    el = await page.query_selector(f"[name='{m.name}']")

                if el:
                    val_str = str(m.mapped_value)
                    if m.target_profile_path == "resume.file_path":
                        await el.set_input_files(val_str)
                    else:
                        await el.fill(val_str)
                    filled += 1
            except Exception:
                review += 1

        return {"filled_count": filled, "review_count": review}
