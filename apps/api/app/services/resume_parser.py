import io
import re
from typing import Any, Dict, List, Optional, Tuple
import pypdf
import docx


def clean_text(text: str) -> str:
    """Normalize whitespace, join broken hyphenated words, and standardize bullets."""
    if not text:
        return ""
    # Replace carriage returns, tabs, non-breaking spaces
    text = text.replace("\r\n", "\n").replace("\r", "\n").replace("\xa0", " ").replace("\x00", "")
    
    # Fix hyphenated line breaks (e.g., "imple-\nmentation" -> "implementation")
    text = re.sub(r"(\w+)-\n\s*(\w+)", r"\1\2", text)
    
    # Standardize bullet symbols
    text = re.sub(r"[\u2022\u2023\u25E6\u2043\u2219\u25CF\u25AA\u25A0]\s*", "• ", text)
    
    # Collapse multiple consecutive newlines to maximum 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Collapse excessive horizontal spaces/tabs
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF resume using pypdf with layout mode fallback."""
    stream = io.BytesIO(file_bytes)
    reader = pypdf.PdfReader(stream)
    pages_text: List[str] = []

    for page in reader.pages:
        page_text = ""
        # Try layout-aware extraction first for multi-column resumes
        try:
            page_text = page.extract_text(extraction_mode="layout")
        except Exception:
            pass

        if not page_text or len(page_text.strip()) < 20:
            try:
                page_text = page.extract_text()
            except Exception:
                page_text = ""

        if page_text:
            pages_text.append(page_text)

    return clean_text("\n\n".join(pages_text))


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX resume including paragraphs, tables, and headers."""
    stream = io.BytesIO(file_bytes)
    doc = docx.Document(stream)
    parts: List[str] = []

    # Paragraph text
    for paragraph in doc.paragraphs:
        if paragraph.text.strip():
            parts.append(paragraph.text.strip())

    # Table content (many professional resumes format skills or experience in tables)
    for table in doc.tables:
        for row in table.rows:
            row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_text:
                parts.append(" | ".join(row_text))

    return clean_text("\n\n".join(parts))


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """Universal resume text extractor supporting PDF, DOCX, and plain text."""
    filename_lower = filename.lower()
    if filename_lower.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif filename_lower.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    else:
        # Fallback to UTF-8 decoding with latin-1 fallback
        try:
            return clean_text(file_bytes.decode("utf-8"))
        except UnicodeDecodeError:
            return clean_text(file_bytes.decode("latin-1", errors="ignore"))


# ==============================================================================
# SECTION PARSING & SEGMENTATION
# ==============================================================================

SECTION_PATTERNS = {
    "summary": re.compile(
        r"^(?:professional\s+summary|executive\s+summary|summary|profile|about\s+me|objective)\b",
        re.IGNORECASE,
    ),
    "skills": re.compile(
        r"^(?:technical\s+skills|core\s+competencies|skills\s*(?:&|and)\s*proficiencies|technologies|skills)\b",
        re.IGNORECASE,
    ),
    "experience": re.compile(
        r"^(?:work\s+experience|professional\s+experience|employment\s+history|experience|internships|work\s+history)\b",
        re.IGNORECASE,
    ),
    "education": re.compile(
        r"^(?:education|academic\s+background|academic\s+qualifications|qualifications)\b",
        re.IGNORECASE,
    ),
    "projects": re.compile(
        r"^(?:personal\s+projects|technical\s+projects|academic\s+projects|key\s+projects|featured\s+projects|projects)\b",
        re.IGNORECASE,
    ),
    "certifications": re.compile(
        r"^(?:certifications|certificates|licenses|achievements|honors\s*(?:&|and)\s*awards)\b",
        re.IGNORECASE,
    ),
}


def segment_resume_sections(text: str) -> Dict[str, str]:
    """Segment resume into standard sections based on detected section headings."""
    lines = text.split("\n")
    sections: Dict[str, List[str]] = {
        "header": [],
        "summary": [],
        "skills": [],
        "experience": [],
        "education": [],
        "projects": [],
        "certifications": [],
    }

    current_section = "header"

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current_section != "header":
                sections[current_section].append("")
            continue

        # Check if line matches a known section header
        cleaned_header = re.sub(r"[:\-_|•#*]", "", stripped).strip()
        matched_section = None

        if len(cleaned_header.split()) <= 5:  # Headers are concise
            for sec_key, pattern in SECTION_PATTERNS.items():
                if pattern.match(cleaned_header):
                    matched_section = sec_key
                    break

        if matched_section:
            current_section = matched_section
        else:
            sections[current_section].append(line)

    return {k: "\n".join(v).strip() for k, v in sections.items()}


# ==============================================================================
# CONTACT & METADATA EXTRACTION
# ==============================================================================

def extract_candidate_name(text: str) -> Optional[str]:
    """Extract candidate name typically located in the top lines of the resume."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    ignore_words = [
        "resume", "curriculum", "vitae", "cv", "page", "email", "phone",
        "contact", "github", "linkedin", "http", "www", "portfolio"
    ]

    for line in lines[:5]:
        line_clean = re.sub(r"[,|\-•/].*", "", line).strip()
        line_lower = line_clean.lower()
        if any(w in line_lower for w in ignore_words):
            continue
        words = line_clean.split()
        if 2 <= len(words) <= 4 and all(re.match(r"^[A-Za-z.'-]+$", w) for w in words):
            return line_clean

    return None


def extract_email(text: str) -> Optional[str]:
    """Extract first valid email address from resume."""
    match = re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b", text)
    return match.group(0).lower().strip() if match else None


def extract_phone(text: str) -> Optional[str]:
    """Extract international or standard phone number."""
    # Matches +91 9876543210, +1 (555) 019-2834, 555-019-2834, etc.
    patterns = [
        r"\+?\d{1,3}[-.\s]?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}",
        r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",
    ]
    for p in patterns:
        match = re.search(p, text)
        if match:
            cand = match.group(0).strip()
            digits = re.sub(r"\D", "", cand)
            if 10 <= len(digits) <= 15:
                return cand
    return None


def extract_urls(text: str) -> Dict[str, Optional[str]]:
    """Extract LinkedIn, GitHub, Portfolio, and other profile links."""
    urls: Dict[str, Optional[str]] = {
        "linkedin_url": None,
        "github_url": None,
        "portfolio_url": None,
    }

    # LinkedIn
    linkedin_match = re.search(
        r"(?:https?://)?(?:www\.)?linkedin\.com/in/([A-Za-z0-9_-]+)", text, re.IGNORECASE
    )
    if linkedin_match:
        urls["linkedin_url"] = f"https://linkedin.com/in/{linkedin_match.group(1)}"

    # GitHub
    github_match = re.search(
        r"(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9_-]+)", text, re.IGNORECASE
    )
    if github_match and github_match.group(1).lower() not in ["features", "pricing", "login"]:
        urls["github_url"] = f"https://github.com/{github_match.group(1)}"

    # Portfolio / personal website
    portfolio_labeled = re.search(
        r"(?:portfolio|website)\s*[:\-]?\s*(https?://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:/[^\s]*)?)",
        text,
        re.IGNORECASE,
    )
    if portfolio_labeled and not any(k in portfolio_labeled.group(1).lower() for k in ["linkedin.com", "github.com"]):
        urls["portfolio_url"] = portfolio_labeled.group(1).rstrip(".")
    else:
        all_urls = re.findall(r"https?://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:/[^\s,)]*)?", text, re.IGNORECASE)
        for u in all_urls:
            u_low = u.lower()
            if not any(k in u_low for k in ["linkedin.com", "github.com", "twitter.com", "x.com", "medium.com", "google.com", "pypi.org"]):
                urls["portfolio_url"] = u.rstrip(".")
                break

    return urls


def extract_location(text: str) -> Optional[str]:
    """Detect location (City, State/Country) from header."""
    header_lines = [l.strip() for l in text.split("\n")[:8] if l.strip()]
    for line in header_lines:
        chunks = [c.strip() for c in re.split(r"[|•·]", line)]
        for chunk in chunks:
            if "@" not in chunk and "http" not in chunk and "github" not in chunk and "linkedin" not in chunk and "+" not in chunk:
                if any(k in chunk.lower() for k in [
                    "india", "usa", "delhi", "ncr", "noida", "ghaziabad", "bangalore", "bengaluru",
                    "hyderabad", "pune", "mumbai", "gurgaon", "california", "ny", "texas", "london", "canada"
                ]):
                    return chunk
    return None


# ==============================================================================
# EDUCATION EXTRACTION
# ==============================================================================

DEGREE_PATTERNS = [
    r"Bachelor\s+of\s+Technology", r"\bB\.?Tech\b", r"\bB\.?E\.?\b",
    r"Bachelor\s+of\s+Science", r"\bB\.?S\.?\b", r"\bB\.?Sc\b",
    r"Master\s+of\s+Technology", r"\bM\.?Tech\b", r"(?<!I)\bM\.?S\.?\b", r"\bM\.?Sc\b",
    r"Master\s+of\s+Computer\s+Applications", r"\bMCA\b", r"\bBCA\b",
    r"Ph\.?D\.?\b", r"Doctor\s+of\s+Philosophy",
]

INSTITUTION_KEYWORDS = [
    "University", "College", "Institute", "Academy", "School", "IIT", "NIT", "IIIT", "AKTU"
]


def extract_education_entries(education_text: str) -> List[Dict[str, Any]]:
    """Extract structured education entries from the education section."""
    if not education_text.strip():
        return []

    entries: List[Dict[str, Any]] = []
    lines = [l.strip() for l in education_text.split("\n") if l.strip()]

    current_entry: Dict[str, Any] = {
        "institution": "",
        "degree": "",
        "field_of_study": "",
        "start_year": None,
        "end_year": None,
        "grade": None,
    }

    for line in lines:
        # Check institution
        if any(k.lower() in line.lower() for k in INSTITUTION_KEYWORDS) and not current_entry["institution"]:
            current_entry["institution"] = line.split("|")[0].strip()

        # Check degree
        for dp in DEGREE_PATTERNS:
            d_match = re.search(dp, line, re.IGNORECASE)
            if d_match:
                current_entry["degree"] = d_match.group(0).strip()
                field_match = re.search(r"(?:in|of)\s+([A-Za-z\s&]+?)(?:\||\n|,|$)", line, re.IGNORECASE)
                if field_match and len(field_match.group(1).strip().split()) <= 5:
                    current_entry["field_of_study"] = field_match.group(1).strip()
                break

        # Check dates/years: 2023 - 2027
        year_match = re.search(r"\b(20\d{2}|19\d{2})\s*(?:[-–—to\s]+)\s*(20\d{2}|Present|Expected)?\b", line, re.IGNORECASE)
        if year_match:
            try:
                current_entry["start_year"] = int(year_match.group(1))
                if year_match.group(2) and year_match.group(2).isdigit():
                    current_entry["end_year"] = int(year_match.group(2))
            except Exception:
                pass

        # Check CGPA / GPA
        grade_match = re.search(r"(?:CGPA|GPA|Percentage)\s*[:=]?\s*([0-9.]+(?:\s*/\s*[0-9.]+)?%?)", line, re.IGNORECASE)
        if grade_match:
            current_entry["grade"] = grade_match.group(0).strip()

        # If both institution AND degree are found, commit entry
        if current_entry["institution"] and current_entry["degree"]:
            entries.append(dict(current_entry))
            current_entry = {
                "institution": "",
                "degree": "",
                "field_of_study": "",
                "start_year": None,
                "end_year": None,
                "grade": None,
            }

    if current_entry["institution"] or current_entry["degree"]:
        if not current_entry["degree"]:
            current_entry["degree"] = "Bachelor of Technology"
        if not current_entry["institution"]:
            current_entry["institution"] = "University / College"
        entries.append(current_entry)

    return entries


# ==============================================================================
# EXPERIENCE & PROJECTS EXTRACTION
# ==============================================================================

def extract_experience_entries(exp_text: str) -> List[Dict[str, Any]]:
    """Extract structured work experience entries."""
    if not exp_text.strip():
        return []

    entries: List[Dict[str, Any]] = []
    blocks = re.split(r"\n{2,}", exp_text)

    for block in blocks:
        lines = [l.strip() for l in block.split("\n") if l.strip()]
        if not lines:
            continue

        first_line = lines[0]
        # Look for separators like — or | or - between company and role
        parts = re.split(r"\s+[—–\-|]\s+", first_line)
        company = ""
        role = ""

        if len(parts) >= 2:
            company = parts[0].strip()
            role = parts[1].strip()
        else:
            company = first_line
            if len(lines) > 1 and not lines[1].startswith("•"):
                role = lines[1]

        # Date range detection
        start_date = None
        end_date = None
        date_pattern = re.compile(
            r"\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—to\s]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|Present|Current)\b",
            re.IGNORECASE,
        )

        for line in lines[:3]:
            dm = date_pattern.search(line)
            if dm:
                start_date = dm.group(1).strip()
                end_date = dm.group(2).strip()
                break

        # Collect bullet points and description
        desc_lines = [l for l in lines if l.startswith("•") or l.startswith("-") or l.startswith("*")]
        if not desc_lines:
            desc_lines = lines[1:]

        description = "\n".join(desc_lines).strip()

        if company:
            entries.append({
                "company": company,
                "role": role or "Software Engineer",
                "start_date": start_date,
                "end_date": end_date,
                "description": description,
            })

    return entries


def extract_project_entries(proj_text: str) -> List[Dict[str, Any]]:
    """Extract structured personal and technical project entries."""
    if not proj_text.strip():
        return []

    entries: List[Dict[str, Any]] = []
    blocks = re.split(r"\n{2,}", proj_text)

    for block in blocks:
        lines = [l.strip() for l in block.split("\n") if l.strip()]
        if not lines:
            continue

        first_line = lines[0]
        parts = re.split(r"\s*[|—–]\s*", first_line)
        name = parts[0].strip()
        technologies: List[str] = []
        url = None

        for part in parts[1:]:
            if "github.com" in part.lower() or "http" in part.lower():
                url = part.strip()
            else:
                # Comma separated tech tags
                tags = [t.strip() for t in part.split(",") if t.strip()]
                technologies.extend(tags)

        # Look for url in description lines as well
        desc_lines = []
        for line in lines[1:]:
            u_match = re.search(r"https?://\S+|github\.com/\S+", line)
            if u_match and not url:
                url = u_match.group(0).rstrip(".)")
            desc_lines.append(line)

        description = "\n".join(desc_lines).strip()

        if name:
            entries.append({
                "name": name,
                "description": description,
                "technologies": technologies,
                "url": url,
            })

    return entries


def calculate_experience_years(experience_entries: List[Dict[str, Any]], raw_text: str) -> float:
    """Derive years of experience either from text mention or parsed date spans."""
    # Look for explicit mention: "X+ years of experience"
    exp_match = re.search(r"(\d+(?:\.\d+)?)\+?\s*years?(?:\s+of)?(?:\s+experience)?", raw_text, re.IGNORECASE)
    if exp_match:
        try:
            return float(exp_match.group(1))
        except Exception:
            pass

    # Sum up approximate years from experience blocks
    total_months = 0
    year_regex = re.compile(r"\b(20\d{2}|19\d{2})\b")
    for exp in experience_entries:
        sd = exp.get("start_date") or ""
        ed = exp.get("end_date") or ""
        s_years = year_regex.findall(sd)
        e_years = year_regex.findall(ed)
        if s_years:
            start_yr = int(s_years[0])
            end_yr = int(e_years[0]) if e_years else 2026  # default to current year
            diff = max(0, end_yr - start_yr)
            total_months += diff * 12 or 6  # At least 6 months if same year
    if total_months > 0:
        return round(total_months / 12.0, 1)

    return 1.0  # Default 1.0 year minimum for candidates with projects/experience
