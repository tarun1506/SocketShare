import os
import json
import pytest
from unittest.mock import patch, MagicMock
from io import BytesIO
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    """Test the health check endpoint."""
    response = client.get('/_health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'OK'

@patch('app.s3_client')
def test_upload_file_success(mock_s3_client, client):
    """Test successful file upload."""
    # Mock file
    file_content = b'test file content'
    file_name = 'test_file.txt'
    
    # Mock the S3 upload
    mock_s3_client.upload_fileobj.return_value = None
    
    # Create test data
    data = {
        'file': (BytesIO(file_content), file_name)
    }
    
    # Make request
    response = client.post('/upload', data=data, content_type='multipart/form-data')
    
    # Assertions
    assert response.status_code == 200
    response_data = json.loads(response.data)
    assert 'message' in response_data
    assert 'file_url' in response_data
    assert response_data['message'] == 'File uploaded successfully'
    
    # Verify S3 client was called correctly
    mock_s3_client.upload_fileobj.assert_called_once()

def test_upload_file_no_file(client):
    """Test upload endpoint with no file."""
    response = client.post('/upload', data={}, content_type='multipart/form-data')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['error'] == 'No file provided'

def test_upload_file_empty_filename(client):
    """Test upload endpoint with empty filename."""
    data = {
        'file': (BytesIO(b''), '')
    }
    response = client.post('/upload', data=data, content_type='multipart/form-data')
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['error'] == 'No selected file'

@patch('app.s3_client')
def test_list_files_success(mock_s3_client, client):
    """Test successful file listing."""
    # Mock S3 response
    mock_response = {
        'Contents': [
            {'Key': 'file1.txt'},
            {'Key': 'file2.jpg'}
        ]
    }
    mock_s3_client.list_objects_v2.return_value = mock_response
    
    # Make request
    response = client.get('/files')
    
    # Assertions
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'files' in data
    assert len(data['files']) == 2
    
    # Verify S3 client was called correctly
    mock_s3_client.list_objects_v2.assert_called_once()

@patch('app.s3_client')
def test_list_files_empty(mock_s3_client, client):
    """Test listing files when bucket is empty."""
    # Mock S3 response with no contents
    mock_response = {}
    mock_s3_client.list_objects_v2.return_value = mock_response
    
    # Make request
    response = client.get('/files')
    
    # Assertions
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'files' in data
    assert len(data['files']) == 0

@patch('app.s3_client')
def test_delete_file_success(mock_s3_client, client):
    """Test successful file deletion."""
    # Mock S3 delete
    mock_s3_client.delete_object.return_value = None
    
    # Make request
    response = client.delete('/delete/test_file.txt')
    
    # Assertions
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'File deleted successfully'
    
    # Verify S3 client was called correctly
    mock_s3_client.delete_object.assert_called_once()

@patch('app.s3_client')
def test_delete_file_error(mock_s3_client, client):
    """Test file deletion with S3 error."""
    # Mock S3 delete to raise exception
    mock_s3_client.delete_object.side_effect = Exception("S3 error")
    
    # Make request
    response = client.delete('/delete/test_file.txt')
    
    # Assertions
    assert response.status_code == 500
    data = json.loads(response.data)
    assert 'error' in data
    assert data['error'] == 'S3 error'

@patch('app.s3_client')
def test_download_file_success(mock_s3_client, client):
    """Test successful file download."""
    # Mock the presigned URL
    presigned_url = "https://test-bucket.s3.amazonaws.com/test_file.txt?signature=abc123"
    mock_s3_client.generate_presigned_url.return_value = presigned_url
    
    # Make request
    response = client.get('/download/test_file.txt')
    
    # Assertions
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'download_url' in data
    assert data['download_url'] == presigned_url
    
    # Verify S3 client was called correctly
    mock_s3_client.generate_presigned_url.assert_called_once_with(
        'get_object',
        Params={'Bucket': os.getenv("S3_BUCKET_NAME"), 'Key': 'test_file.txt'},
        ExpiresIn=3600
    )

@patch('app.s3_client')
def test_download_file_error(mock_s3_client, client):
    """Test file download with S3 error."""
    # Mock S3 generate_presigned_url to raise exception
    mock_s3_client.generate_presigned_url.side_effect = Exception("S3 error")
    
    # Make request
    response = client.get('/download/test_file.txt')
    
    # Assertions
    assert response.status_code == 500
    data = json.loads(response.data)
    assert 'error' in data
    assert data['error'] == 'S3 error' 