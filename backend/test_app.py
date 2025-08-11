from app import create_app

app = create_app()
print('App created successfully')
print('Registered routes:')
for rule in app.url_map.iter_rules():
    print(f'{rule.endpoint}: {rule.rule}')