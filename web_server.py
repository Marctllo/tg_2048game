from flask import Flask, send_from_directory
import logging

app = Flask(
    __name__, static_folder='web_app', template_folder='web_app'
)
logging.basicConfig(level=logging.INFO)

@app.route('/')
def index():
    return send_from_directory('web_app', 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('web_app', path)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)