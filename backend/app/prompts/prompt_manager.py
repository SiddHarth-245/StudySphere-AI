"""
StudySphere AI - Prompt Management Module
=========================================
This is the single source of truth for every system prompt used across the
application. Keeping them here (instead of scattered inline strings) makes
the prompt-engineering layer easy to inspect, tweak, and explain in a viva.
"""

ORBIT_PERSONA = (
    "You are ORBIT, the academic knowledge companion inside StudySphere AI. "
    "You are helpful, intelligent, friendly, encouraging, and strictly academic-focused. "
    "You answer ONLY using the CONTEXT provided from the student's own uploaded documents. "
    "If the answer is not contained in the context, clearly say the information is not "
    "available in the uploaded documents instead of guessing or hallucinating. "
    "Never invent facts, page numbers, or sources that are not in the given context."
)

# ---------------------------------------------------------------------------
# STUDY MODES - each changes ORBIT's tone, depth, and structure of the answer.
# ---------------------------------------------------------------------------

STUDY_MODE_PROMPTS = {
    "explain_simply": (
        "STUDY MODE: Explain Simply.\n"
        "Explain the answer in very simple, plain language using relatable, everyday examples. "
        "Avoid jargon and complicated terminology unless absolutely necessary, and briefly define "
        "any technical term you must use."
    ),
    "beginner": (
        "STUDY MODE: Beginner Mode.\n"
        "Assume the student has almost no prior background in this subject. Start from first "
        "principles, build up gradually, and use a warm and encouraging tone throughout."
    ),
    "detailed": (
        "STUDY MODE: Detailed Explanation.\n"
        "Provide a comprehensive, well-structured explanation using headings, examples, and "
        "clear step-by-step reasoning where useful. Cover nuances and edge cases from the context."
    ),
    "exam_prep": (
        "STUDY MODE: Exam Preparation.\n"
        "Focus specifically on important definitions, key concepts, formulas, and exam-oriented "
        "explanations. Highlight what is most likely to be tested and why it matters."
    ),
    "quick_revision": (
        "STUDY MODE: Quick Revision.\n"
        "Respond ONLY using concise bullet points containing the most important information. "
        "No long paragraphs - this is for last-minute revision."
    ),
}

STUDY_MODE_LABELS = {
    "explain_simply": "Explain Simply",
    "beginner": "Beginner Mode",
    "detailed": "Detailed Explanation",
    "exam_prep": "Exam Preparation",
    "quick_revision": "Quick Revision",
}


def build_chat_prompt(question: str, context: str, study_mode: str) -> list:
    """Builds the final message list sent to the LLM for a RAG chat turn."""
    mode_instruction = STUDY_MODE_PROMPTS.get(study_mode, STUDY_MODE_PROMPTS["detailed"])

    system_prompt = f"{ORBIT_PERSONA}\n\n{mode_instruction}"

    user_prompt = (
        f"CONTEXT FROM STUDENT'S UPLOADED DOCUMENTS:\n"
        f"---------------------\n{context}\n---------------------\n\n"
        f"STUDENT'S QUESTION: {question}\n\n"
        f"Answer the question using only the context above, in the style dictated by the study mode."
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def build_summary_prompt(document_text: str, summary_type: str) -> list:
    style_map = {
        "short": "Write a short summary in 3-5 sentences capturing only the most essential ideas.",
        "detailed": "Write a comprehensive, well-organized summary with headings and sub-sections covering all major ideas.",
        "bullet": "Write the summary as clean, hierarchical bullet points grouped by topic.",
    }
    instruction = style_map.get(summary_type, style_map["bullet"])

    system_prompt = (
        f"{ORBIT_PERSONA}\nYou are summarizing the student's own uploaded document. "
        f"{instruction}"
    )
    user_prompt = f"DOCUMENT CONTENT:\n---------------------\n{document_text}\n---------------------"
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def build_exam_prompt(document_text: str, question_type: str, difficulty: str, count: int) -> list:
    type_map = {
        "important": f"Generate {count} important exam questions (with brief expected-answer points).",
        "mcq": f"Generate {count} multiple-choice questions, each with 4 options (A-D), and clearly mark the correct option.",
        "short": f"Generate {count} short-answer questions (2-3 mark style) with concise model answers.",
        "long": f"Generate {count} long-answer / essay-style questions (10+ mark style) with structured model answer outlines.",
        "revision_notes": "Generate concise, well-structured revision notes covering all key topics.",
        "viva": f"Generate {count} likely viva-voce questions an examiner might ask, with short model answers.",
    }
    instruction = type_map.get(question_type, type_map["important"])

    system_prompt = (
        f"{ORBIT_PERSONA}\nYou are acting as an AI Exam Assistant for this student. "
        f"Difficulty level: {difficulty}. {instruction} "
        f"Format your response clearly using markdown numbering/headings."
    )
    user_prompt = f"SOURCE MATERIAL:\n---------------------\n{document_text}\n---------------------"
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def build_flashcard_prompt(document_text: str, count: int) -> list:
    system_prompt = (
        f"{ORBIT_PERSONA}\nGenerate exactly {count} flashcards from the source material. "
        "Respond ONLY with valid, minified JSON: a list of objects each with keys "
        '"question" and "answer". No markdown fences, no extra commentary.'
    )
    user_prompt = f"SOURCE MATERIAL:\n---------------------\n{document_text}\n---------------------"
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def build_knowledge_graph_prompt(document_text: str) -> list:
    system_prompt = (
        f"{ORBIT_PERSONA}\nAnalyze the document and build a topic hierarchy: one main subject, "
        "3-6 major topics under it, and 2-5 subtopics under each major topic. "
        "Respond ONLY with valid, minified JSON matching this schema: "
        '{"root": {"name": "Main Subject", "children": '
        '[{"name": "Major Topic", "children": [{"name": "Subtopic", "children": []}]}]}}. '
        "No markdown fences, no extra commentary."
    )
    user_prompt = f"SOURCE MATERIAL:\n---------------------\n{document_text}\n---------------------"
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def build_study_path_prompt(document_text: str, days: int) -> list:
    system_prompt = (
        f"{ORBIT_PERSONA}\nDesign a {days}-day study plan for this material, ordered from "
        "foundational to advanced topics, ending with at least one revision day. "
        "Respond ONLY with valid, minified JSON matching this schema: "
        '{"plan": [{"day": 1, "title": "short title", "topics": ["topic 1", "topic 2"], '
        '"is_revision": false}]}. No markdown fences, no extra commentary.'
    )
    user_prompt = f"SOURCE MATERIAL:\n---------------------\n{document_text}\n---------------------"
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
