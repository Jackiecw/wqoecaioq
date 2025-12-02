with open('frontend/src/components/dashboard/DashboardHome.vue', 'rb') as f:
    content = f.read(100)
    print(content)
    print(content.hex())
