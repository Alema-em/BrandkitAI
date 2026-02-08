# Brandkit AI

Brandkit AI is a local, AI-powered tool that transforms simple business ideas into complete brand identities.

It generates:
- Brand name  
- Brand personality  
- Color palette  
- Typography  
- Logo concept  
- Brand voice  
- Sample marketing text  

All outputs are structured as JSON and downloadable.

---
## Screenshots
<img width="749" height="348" alt="Screenshot 2026-02-08 215429" src="https://github.com/user-attachments/assets/8ed1a738-0ce3-458f-8ca8-c575871821a0" />
<img width="1433" height="747" alt="Screenshot 2026-02-08 231931" src="https://github.com/user-attachments/assets/11707556-73cd-485f-a47b-379b41b11227" />
<img width="1444" height="831" alt="Screenshot 2026-02-08 231920" src="https://github.com/user-attachments/assets/dd30ac05-e21d-4d2a-8181-d01c6f771218" />


## Tech Stack
- Python  
- Streamlit  
- Ollama   

---

## How to Run Locally

1. Install **Ollama**: https://ollama.com  
2. Pull the model:ollama ollama pull llama3.1:8b  
3. Create a virtual environment:python -m venv .venv
                                ..venv\Scripts\activate
                                pip install -r requirements.txt
4. Run the app:streamlit run ui.py


## Future Roadmap
- Auto-generate real logos  
- Create branding posters  
- Generate sample landing pages  
