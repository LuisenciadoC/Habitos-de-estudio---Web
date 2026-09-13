from flask import Blueprint, request, jsonify
from services.usuarios_service import procesar_usuario_nuevo

usuarios_bp = Blueprint('usuarios', __name__)

@usuarios_bp.route('/registro', methods = ['POST'])
def registro():
    datos = request.json
    resultado = procesar_usuario_nuevo(datos)
    
    if resultado["exito"]:
        return jsonify(resultado), 201      # 201 = Creado exitosamente.
    else:
        return jsonify(resultado), 400      # 400 = Error en peticion.