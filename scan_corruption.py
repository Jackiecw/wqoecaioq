import os
import re

def scan_files(directory):
    suspicious_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.vue'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                    
                    for i, line in enumerate(lines):
                        # Check for ? at end of line (suspicious replacement of closing quote)
                        if line.strip().endswith('?'):
                            suspicious_files.append((filepath, i + 1, line.strip()))
                        # Check for ? followed by ) or ; or } (suspicious replacement of closing quote)
                        elif re.search(r"\?['\"\)};]", line):
                             suspicious_files.append((filepath, i + 1, line.strip()))
                        # Check for Unterminated string (heuristic)
                        # This is hard to do perfectly, but we can check for odd number of quotes if we ignore escaped ones
                        # But simpler: check for '未填? or similar patterns
                        elif '未填?' in line or '未命名?' in line or '未分?' in line:
                             suspicious_files.append((filepath, i + 1, line.strip()))
                        # Check for '页' which was a bad replacement for '?'
                        elif '页' in line:
                             suspicious_files.append((filepath, i + 1, line.strip()))

                except Exception as e:
                    print(f"Error reading {filepath}: {e}")

    return suspicious_files

if __name__ == "__main__":
    directory = r"d:\Code\internal-site-2\frontend\src\components"
    results = scan_files(directory)
    with open('corruption_report.txt', 'w', encoding='utf-8') as f:
        for filepath, line_num, content in results:
            f.write(f"{filepath}:{line_num}: {content}\n")
    print("Scan complete. Results written to corruption_report.txt")
