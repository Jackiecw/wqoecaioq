import os

def recover(filepath):
    try:
        with open(filepath, 'r', encoding='gbk') as f:
            content = f.read()
        
        # Reverse Mojibake: String -> GBK Bytes -> UTF-8 String
        raw_bytes = content.encode('gbk')
        recovered_content = raw_bytes.decode('utf-8')
        
        print(f"Successfully recovered {filepath}")
        # print snippet
        print(recovered_content[:100])
        
        # Save back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(recovered_content)
            
    except Exception as e:
        print(f"Failed to recover {filepath}: {e}")

recover('frontend/src/components/dashboard/DashboardHome.vue')
