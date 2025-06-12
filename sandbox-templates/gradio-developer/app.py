import gradio as gr
from gradio_codeanalysisviewer import CodeAnalysisViewer # type: ignore
from typing import Dict, Any

# The initial greet function and demo instance are removed as the user's code
# intends to replace them with the CodeAnalysisViewer setup.

example_data = {
    "code": """def greet(name):
    print(f"Hello, {name}!")

greet("User")""",
    "issue": "Security Risk: Use of f-string in print might be risky if 'name' is user-controlled and not sanitized.",
    "reason": """Formatted string literals (f-strings) can be vulnerable to injection if they include unsanitized user input, 
though in this specific 'print' case, the direct risk is low unless the output is piped elsewhere or has special terminal interpretations.""",
    "fixed_code": """def greet(name):
    # Sanitize name if it comes from an external source, e.g., name = escape(name)
    print(f"Hello, {name}!")"""
}

component_example = CodeAnalysisViewer().example_value()

def process_data(data_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Processes the input dictionary."""
    return data_dict

demo = gr.Interface(
    process_data,
    CodeAnalysisViewer(label="Input Analysis (Interactive - if it were input)"), # This would be for input, not our primary use case
    CodeAnalysisViewer(label="Code Analysis Output"), # This is how we'll use it as an output display
    examples=[[component_example], [example_data]] # Provide examples
)


if __name__ == "__main__":
    demo.launch()
