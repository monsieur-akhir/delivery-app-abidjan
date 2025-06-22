from sqlalchemy import text, inspect

def safe_create_table(op, table_name, *args, **kwargs):
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()
    if table_name not in tables:
        op.create_table(table_name, *args, **kwargs)

def safe_create_index(op, index_name, table_name, columns, unique=False):
    conn = op.get_bind()
    index_exists = conn.execute(text(f"""
        SELECT 1 FROM pg_indexes WHERE tablename = '{table_name}' AND indexname = '{index_name}'
    """)).fetchone()
    if not index_exists:
        op.create_index(index_name, table_name, columns, unique=unique)

def safe_add_column(op, table_name, column):
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    if column.name not in columns:
        op.add_column(table_name, column) 