import os
import boto3
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from urllib.parse import unquote

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

@app.route("/delete/<path:filename>", methods=["DELETE"])
def delete_file(filename):
    # Decode the percent-encoded filename and then sanitize it.
    filename = secure_filename(unquote(filename))
    try:
        s3_client.delete_object(Bucket=S3_BUCKET, Key=filename)
        return jsonify({"message": "File deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/download/<path:filename>", methods=["GET"])
def download_file(filename):
    # Decode the percent-encoded filename and then sanitize it.
    filename = secure_filename(unquote(filename))
    try:
        # Generate a presigned URL for the S3 object
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET, 'Key': filename},
            ExpiresIn=3600  # URL expires in 1 hour
        )
        return jsonify({"download_url": presigned_url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/search", methods=["GET"])
def search_files():
    try:
        query = request.args.get("query", "").lower()
        if not query:
            return jsonify({"files": []}), 200
            
        files = s3_client.list_objects_v2(Bucket=S3_BUCKET)
        matching_files = [
            f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{file['Key']}"
            for file in files.get("Contents", [])
            if query in file['Key'].lower()
        ]
        return jsonify({"files": matching_files}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app_env = os.getenv("APP_ENV")
    port = int(os.getenv("PORT", 3000))
    if app_env == "development":
        app.run(debug=True, port=port)
    else:
        app.run(host="0.0.0.0", debug=False, port=port)
