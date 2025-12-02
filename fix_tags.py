import os
import glob

def fix_tags():
    files = glob.glob('frontend/src/components/**/*.vue', recursive=True)
    count = 0
    for filepath in files:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if '?/' in content:
                new_content = content.replace('?/', '</')
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed tags in {filepath}")
                count += 1
        except Exception as e:
            print(f"Failed to process {filepath}: {e}")
    
    print(f"Total files fixed: {count}")

fix_tags()
