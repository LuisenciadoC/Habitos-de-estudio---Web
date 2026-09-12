from pickle import FALSE

from models.usuarios_model import registrar_usuario

def procesar_usuario_nuevo(datos_json):
    
    #Validar que todos los datos obligatios esten.
    if not datos_json.get('apodo') or not datos_json.get('nombre') or not datos_json.get('correo') or not datos_json.get('contrasena') or not datos_json.get('fecha_nacimiento'):
        return {"exito": False, "mensaje": "Faltan datos obligatorios."}
    
    #Llamar al modelo para guardar en SQL.
    exito = registrar_usuario(
        apodo = datos_json['apodo'],
        nombre=datos_json['nombre'],
        correo=datos_json['correo'],
        contrasena=datos_json['contrasena'],
        fecha_nacimiento=datos_json['fecha_nacimiento'],
        url_foto=datos_json.get('url_foto')                 #Get por que la foto es opcional
    )
    
    #Retornar respuesta.
    if exito:
        return {"exito": True, "mensaje": "Estudiante registrado correctamente."}
    else:
        return {"exito": False, "mensaje": "Error en la base de datos. Quizás el correo o apodo ya existen."}