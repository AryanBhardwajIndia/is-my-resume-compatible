import { useState } from 'react';
import { Upload, Link, FileText, CheckCircle, X } from 'lucide-react';
import './ResumeChecker.css';

export default function ResumeChecker() {
  const [jobLink, setJobLink] = useState('');
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResume(file);
    }
  };

  const handleRemoveFile = () => {
    setResume(null);
    const fileInput = document.getElementById('resume-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    const formData = new FormData();
    formData.append('jobLink', jobLink);
    formData.append('resume', resume);

    try {
      const response = await fetch('https://api.resumechecker.aryanbhardwaj.xyz',{
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.compatibility);
      } else {
        alert('Error: ' + (data.error || 'Something went wrong'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to check compatibility. Please make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = jobLink.trim() !== '' && resume !== null;

  return (
    <div className="resume-checker-container">
      <div className="resume-checker-card">
        <div className="header">
          <div className="icon-wrapper">
            <FileText className="header-icon" />
          </div>
          <h1 className="title">Resume Compatibility Checker</h1>
          <p className="subtitle">
            Check how well your resume matches the job description
          </p>
        </div>

        <div className="form-container">
          <div className="input-section job-link-section">
            <label className="input-label">
              <Link className="label-icon" />
              Job Link
            </label>
            <input
              type="url"
              value={jobLink}
              onChange={(e) => setJobLink(e.target.value)}
              placeholder="https://example.com/job-posting"
              className="text-input"
            />
            {jobLink && (
              <p className="success-message">
                <CheckCircle className="success-icon" />
                Job link added
              </p>
            )}
          </div>

          <div className="input-section resume-section">
            <label className="input-label">
              <Upload className="label-icon" />
              Upload Resume
            </label>
            <div className="upload-wrapper">
              {!resume ? (
                <>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    className="file-input"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="file-label">
                    <div className="file-content">
                      <Upload className="upload-icon" />
                      <p className="file-text">
                        <span className="upload-prompt">Click to upload</span>
                        <span className="upload-hint"> or drag and drop</span>
                      </p>
                      <p className="file-info">PDF, DOC, DOCX (Max 10MB)</p>
                    </div>
                  </label>
                </>
              ) : (
                <div className="uploaded-file">
                  <FileText className="file-icon" />
                  <div className="file-details">
                    <p className="file-name-display">{resume.name}</p>
                    <p className="file-size">{(resume.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="remove-file-btn"
                    title="Remove file"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
            {resume && (
              <p className="success-message">
                <CheckCircle className="success-icon" />
                Resume uploaded successfully
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            className={`submit-button ${isFormValid && !loading ? 'active' : 'disabled'}`}
          >
            {loading ? 'Analyzing...' : isFormValid ? 'Check Compatibility' : 'Please fill all fields'}
          </button>
        </div>

        {results && (
          <div className="results-container">
            <div className="score-section">
              <h2 className="results-title">Compatibility Score</h2>
              <div className="score-circle">
                <span className="score-value">{results.score}%</span>
              </div>
              <p className="score-description">
                {results.totalMatchingKeywords} out of {results.totalJobKeywords} key requirements matched
              </p>
            </div>

            {results.matchingKeywords.length > 0 && (
              <div className="keywords-section matching">
                <h3 className="keywords-title">✅ Matching Keywords</h3>
                <div className="keywords-list">
                  {results.matchingKeywords.map((keyword, index) => (
                    <span key={index} className="keyword keyword-match">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {results.missingKeywords.length > 0 && (
              <div className="keywords-section missing">
                <h3 className="keywords-title">⚠️ Missing Keywords</h3>
                <div className="keywords-list">
                  {results.missingKeywords.map((keyword, index) => (
                    <span key={index} className="keyword keyword-missing">
                      {keyword}
                    </span>
                  ))}
                </div>
                <p className="keywords-hint">
                  Consider adding these keywords to your resume to improve compatibility
                </p>
              </div>
            )}
          </div>
        )}

        <div className="footer">
          <p className="footer-text">
            🔒 Your data is secure and will only be used for compatibility analysis
          </p>
        </div>
      </div>
    </div>
  );
}