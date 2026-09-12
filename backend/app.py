from flask import Flask, jsonify
from flask_cors import CORS

from controllers.usuarios_controller import usuarios_bp

app = Flask(__name__)
CORS(app)

#Blueprints
app.register_blueprint(usuarios_bp, url_prefix = '/api/usuarios')

@app.route('/', methods = ['GET'])
def inicio():
    return jsonify({"mensaje": "Servidor funcionando"})

if __name__ == '__main__':
    app.run(debug = True, port = 5000)