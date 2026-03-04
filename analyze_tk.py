import pandas as pd
import sys

file_path = r'd:\Code\internal-site-2\示例数据集\TK订单示例.xlsx'
try:
    xls = pd.ExcelFile(file_path)
    print('Sheets:', xls.sheet_names)
    for sheet in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet)
        print(f"[{sheet}] shape: {df.shape}")
        print(f"[{sheet}] columns: {df.columns.tolist()}")
except Exception as e:
    print(e)
