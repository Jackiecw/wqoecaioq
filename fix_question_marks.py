import os

def fix_question_marks(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.vue'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Replace '页' with '?' specifically in ternary-like contexts or just globally if safe
                    # Given '页' is 'page' in Chinese, we should be careful.
                    # But in the context of code syntax like "condition 页 true : false", it's definitely a bug.
                    # Let's look for " 页 " (with spaces) or just replace it if it looks like syntax.
                    
                    # Actually, looking at the examples:
                    # isSnapshotMode 页 'fixed...
                    # selectedCountry === country.code\n                      页 'bg-white...
                    
                    # It seems safe to replace " 页 " with " ? "
                    # Or even "页" with "?" if we are careful about Chinese text.
                    # But "页" means "page". It might be used in text like "第 1 页".
                    
                    # Let's use a regex to be safer, or just replace " 页 " (space page space)
                    # The examples showed spaces around it.
                    
                    new_content = content.replace(' 页 ', ' ? ')
                    
                    # Also handle cases where it might be at start of line (after indentation)
                    # "                      页 'bg-white..."
                    # So we should replace "页" if it's surrounded by whitespace?
                    
                    lines = content.split('\n')
                    fixed_lines = []
                    modified = False
                    
                    for line in lines:
                        # Check if line contains 页 and looks like a ternary
                        # Heuristic: if line has '页' and also ':' later, or if it's part of a multi-line ternary
                        # The examples show:
                        # condition
                        #   页 value
                        #   : value
                        
                        if '页' in line:
                            # If it looks like code syntax
                            # e.g. followed by ' or " or start of line
                            # We want to avoid replacing "第1页"
                            
                            # Simple heuristic: if '页' is surrounded by spaces or is at start/end of trimmed line
                            # AND it's not part of a Chinese sentence.
                            
                            # Let's replace " 页 " with " ? "
                            temp_line = line.replace(' 页 ', ' ? ')
                            
                            # Also replace if it's " 页" at start of stripped line?
                            # e.g. "   页 '..."
                            if temp_line.strip().startswith('页 '):
                                temp_line = temp_line.replace('页 ', '? ', 1)
                                
                            if temp_line != line:
                                fixed_lines.append(temp_line)
                                modified = True
                            else:
                                fixed_lines.append(line)
                        else:
                            fixed_lines.append(line)
                            
                    if modified:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write('\n'.join(fixed_lines))
                        print(f"Fixed {filepath}")
                        
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    directory = r"d:\Code\internal-site-2\frontend\src\components"
    fix_question_marks(directory)
