import os
import glob

def recover_all():
    files = glob.glob('frontend/src/components/**/*.vue', recursive=True)
    for filepath in files:
        try:
            with open(filepath, 'rb') as f:
                content = f.read()
            
            # Try to decode as utf-8, replace errors
            decoded = content.decode('utf-8', errors='replace')
            
            # Write back as valid utf-8
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(decoded)
                
            print(f"Processed {filepath}")
        except Exception as e:
            print(f"Failed to process {filepath}: {e}")

recover_all()
