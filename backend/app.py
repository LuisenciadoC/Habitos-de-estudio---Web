from flask import Flask, jsonify
from flask_cors import CORS
# Importamos la función de conexión que creaste en config.py
from config import get_db_connection 

app = Flask(__name__)
CORS(app)

# Ruta original para ver que el servidor vive
@app.route('/', methods=['GET'])
def inicio():
    return jsonify({"mensaje": "¡Servidor de Hábitos de Estudio encendido y funcionando!"})

# NUEVA RUTA: Para probar la conexión a SQL Server
@app.route('/test-db', methods=['GET'])
def probar_bd():
    conexion = get_db_connection()
    
    if conexion:
        conexion.close() # Siempre debemos cerrar la conexión después de usarla
        return jsonify({
            "estado": "Éxito", 
            "mensaje": "¡Conectado correctamente a SQL Server!"
        })
    else:
        return jsonify({
            "estado": "Error", 
            "mensaje": "Falló la conexión. Revisa tu archivo .env o asegúrate de que SQL Server esté encendido."
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)