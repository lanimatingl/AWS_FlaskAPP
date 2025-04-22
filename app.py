from flask import Flask, render_template, request, jsonify, redirect
import boto3
from botocore.config import Config
import os
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)


AWS_ACCESS_KEY = 'AKIAWC4DXFC6GJY3MZVX'
AWS_SECRET_KEY = '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'
BUCKET_NAME = 'xwebappahmedx'


ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'txt', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


s3 = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    config=Config(
        connect_timeout=3, 
        read_timeout=3,     
        retries={'max_attempts': 1}  
    )
)

@app.route('/')
def index():
    try:
        
        response = s3.list_objects_v2(
            Bucket=BUCKET_NAME,
            MaxKeys=100  
        )
        
        files = []
        if 'Contents' in response:
            for obj in response['Contents']:
                size = round(obj['Size'] / (1024 * 1024), 2)
                files.append({
                    'name': obj['Key'],
                    'size': size,
                    'last_modified': obj['LastModified'].strftime('%Y-%m-%d %H:%M:%S')
                })
        
        return render_template('index.html', files=files)
    except Exception as e:
        print(f"Error listing files: {str(e)}")
        return render_template('index.html', files=[])

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    try:
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        
        
        s3.upload_fileobj(
            file,
            BUCKET_NAME,
            unique_filename
        )
        
        return jsonify({
            'message': 'File uploaded successfully',
            'filename': unique_filename
        }), 200

    except Exception as e:
        print(f"Upload error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/delete/<filename>', methods=['DELETE'])
def delete_file(filename):
    try:
        s3.delete_object(Bucket=BUCKET_NAME, Key=filename)
        return jsonify({'message': 'File deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download/<filename>')
def download_file(filename):
    try:
        
        url = s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': filename,
                'ResponseContentDisposition': f'attachment; filename="{filename}"'
            },
            ExpiresIn=3600
        )
        return redirect(url)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)  
