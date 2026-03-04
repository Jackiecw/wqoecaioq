import pandas as pd
import json

def analyze_excel(file_path):
    df = pd.read_excel(file_path, nrows=3)
    cols = df.columns.tolist()
    first_row = df.iloc[0].to_dict() if not df.empty else {}
    second_row = df.iloc[1].to_dict() if len(df) > 1 else {}
    
    return {
        "columns": cols,
        "row_1": first_row,
        "row_2": second_row
    }

tk_data = analyze_excel(r'd:\Code\internal-site-2\示例数据集\TK订单示例.xlsx')
shopee_data = analyze_excel(r'd:\Code\internal-site-2\示例数据集\虾皮订单示例.xlsx')

with open('excel_analysis.json', 'w', encoding='utf-8') as f:
    json.dump({'tk': tk_data, 'shopee': shopee_data}, f, ensure_ascii=False, indent=2)

print("Analysis written to excel_analysis.json")
