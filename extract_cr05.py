import subprocess
import sys

# Check if PyPDF2 is available
try:
    import PyPDF2
except ImportError:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'PyPDF2', '-q'])
    import PyPDF2

pdf_path = 'Instruction Documents/CR-05_Skills_Wallet_Skill_Tree_Gamification_Module.pdf'
with open(pdf_path, 'rb') as f:
    reader = PyPDF2.PdfReader(f)
    text = ''
    for page in reader.pages:
        text += page.extract_text() + '\n---PAGE BREAK---\n'
    
# Write to file to avoid encoding issues
with open('cr05_content.txt', 'w', encoding='utf-8') as f:
    f.write(text)

print("Content extracted to cr05_content.txt")
