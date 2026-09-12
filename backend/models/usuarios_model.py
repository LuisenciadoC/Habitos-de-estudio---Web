from config import get_db_connection

# Metodo para registrar usuarios en la base de datos
def registrar_usuario(apodo, nombre, correo, contrasena, fecha_nacimiento, url_foto=None):
    conexion = get_db_connection()
    if conexion:
        try:
            cursor = conexion.cursor()
            sql = """
            INSERT INTO Usuarios (apodo_usuario, nombre_usuario, correo_usuario, contrasena_usuario, 
            fecha_nacimiento_usuario, url_foto_usuario)
            VALUES (?, ?, ?, ?, ?, ?)
            """
            cursor.execute(sql, (apodo, nombre, correo, contrasena, fecha_nacimiento, url_foto))
            conexion.commit()
            return True
        
        except Exception as e:
            print(f"Error al insertar el usuario: {e}")
            return False
        
        finally:
            conexion.close()
            
    return False