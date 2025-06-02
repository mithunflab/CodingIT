# Scaffolding for a Streamlit app
import gradio as gr

def greet(name: str, intensity: float) -> str:
    return "Hello, " + name + "!" * int(intensity)

demo = gr.Interface(
    fn=greet,
    inputs=["text", "slider"],
    outputs=["text"],
)

demo.launch()
