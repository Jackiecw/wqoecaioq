with open('frontend/src/components/dashboard/DashboardHome.vue', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    print(f"Line 11: {lines[10]}")
    print(f"Context: {lines[8:13]}")
