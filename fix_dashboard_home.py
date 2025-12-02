import os

def fix_dashboard_home():
    filepath = r"d:\Code\internal-site-2\frontend\src\components\dashboard\DashboardHome.vue"
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix specific patterns observed
        new_content = content.replace('页.', '?.')
        new_content = new_content.replace('页页', '??')
        
        # Also fix single '页' which might be ternary '?'
        # Be careful not to replace Chinese text containing '页' (page)
        # But in DashboardHome.vue, '页' is likely corruption if surrounded by spaces or in code context.
        # We already fixed one instance manually.
        
        # Let's replace ' 页 ' with ' ? '
        new_content = new_content.replace(' 页 ', ' ? ')
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed {filepath}")
        else:
            print(f"No changes made to {filepath}")
            
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    fix_dashboard_home()
