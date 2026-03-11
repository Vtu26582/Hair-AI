import re
import os

html_path = 'index.html'
concept_path = 'concept.html'

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Build concept.html
concept_html = re.sub(
    r'<div class="header-section">.*?<div class="glass-card animation-card', 
    '''<div class="header-section">
                    <h1>Hair Health <span class="highlight">Concepts & Simulation</span></h1>
                    <p class="subtitle">Understanding the medical stages of hair loss and its progression.</p>
                </div>

                <div class="metrics-grid" style="grid-template-columns: 1fr;">

                    <!-- Hair Fall Video Animation Component -->
                    <div class="glass-card animation-card''', 
    html, flags=re.DOTALL
)
with open(concept_path, 'w', encoding='utf-8') as f:
    f.write(concept_html)

# Clean index.html
index_html = re.sub(
    r'<!-- Hair Fall Video Animation Component -->.*?</div>\s*</div>\s*</div>\s*</div>', 
    '''<!-- Link to detailed concept and animation -->
                    <div class="glass-card full-width fade-in" style="animation-delay: 0.2s; text-align: center; padding: 2rem;">
                        <h2>Hair Fall Stages & Simulation</h2>
                        <p class="subtitle" style="margin: 1rem 0;">Explore the detailed medical concepts and watch the visual simulation of hair loss progression.</p>
                        <a href="concept.html" class="btn-primary" style="display: inline-block; text-decoration: none;">View Animation & Concept</a>
                    </div>''', 
    html, flags=re.DOTALL
)
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(index_html)

print("Pages separated successfully!")
