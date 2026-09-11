import os
import pyodbc
from dotenv import load_dotenv

load_dotenv()

DB_SERVER = os.getenv('DB_SERVER')
DB_NAME = os.getenv('DB_NAME')

def get_db_connection():
    try:
        # Usamos Trusted_Connection=yes para que entre con tu cuenta de Windows
        # Usamos Driver 18 y añadimos TrustServerCertificate=yes para evitar el bloqueo de seguridad
        connection_string = f"DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={DB_SERVER};DATABASE={DB_NAME};Trusted_Connection=yes;TrustServerCertificate=yes;"
        
        conexion = pyodbc.connect(connection_string)
        return conexion
        
    except pyodbc.Error as e:
        print(f"Error al conectar a la Base de Datos: {e}")
        return None