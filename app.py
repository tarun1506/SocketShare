import os
import boto3
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS

# AWS S3 Configuration
S3_BUCKET = os.getenv("S3_BUCKET_NAME")
S3_REGION = os.getenv("S3_REGION")
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")

# Initialize S3 client
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=S3_REGION
)

@app.route("/_health")
def health():
    return jsonify({"message": "OK"}), 200

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(file.filename)

    try:
        s3_client.upload_fileobj(file, S3_BUCKET, filename)
        file_url = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{filename}"
        return jsonify({"message": "File uploaded successfully", "file_url": file_url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/files", methods=["GET"])
def list_files():
    try:
        files = s3_client.list_objects_v2(Bucket=S3_BUCKET)
        file_urls = [
            f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{file['Key']}"
            for file in files.get("Contents", [])
        ]
        return jsonify({"files": file_urls}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app_env = os.getenv("APP_ENV")
    port = os.getenv("PORT") if os.getenv("PORT") else 3000
    if app_env == "development":
        app.run(debug=True, port=port)
    else:
        app.run(debug=False, port=port)
