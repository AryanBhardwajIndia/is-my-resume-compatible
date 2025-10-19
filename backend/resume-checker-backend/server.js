// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const cheerio = require('cheerio');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

const app = express();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());

// Function to extract text from URL
async function extractTextFromURL(url) {
  try {
    const https = require('https');
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000,
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false  // This bypasses SSL certificate verification
      }),
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      }
    });

    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script, style, nav, footer, header, iframe, button, .navigation, .menu').remove();
    
    // Get text content
    let text = $('body').text();
    
    // Clean up text
    text = text.replace(/\s+/g, ' ').trim();
    
    console.log('Job text length:', text.length);
    console.log('Job text preview:', text.substring(0, 500));
    
    return text;
  } catch (error) {
    throw new Error(`Failed to extract text from URL: ${error.message}`);
  }
}

// Function to extract text from PDF
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdf(buffer);
    console.log('Resume text length:', data.text.length);
    console.log('Resume text preview:', data.text.substring(0, 500));
    return data.text;
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

// Function to extract text from DOCX
async function extractTextFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    console.log('Resume text length:', result.value.length);
    console.log('Resume text preview:', result.value.substring(0, 500));
    return result.value;
  } catch (error) {
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
}

// Function to extract keywords and phrases from text
function extractKeywords(text) {
  // Convert to lowercase
  text = text.toLowerCase();
  
  // Extract multi-word technical terms and skills (2-3 words)
  const phraseRegex = /\b([a-z][a-z0-9+#.]*(?:\s+[a-z][a-z0-9+#.]*){1,2})\b/g;
  const phrases = [];
  let match;
  
  while ((match = phraseRegex.exec(text)) !== null) {
    const phrase = match[1].trim();
    if (phrase.length > 4 && !phrase.match(/^\d+$/)) {
      phrases.push(phrase);
    }
  }
  
  // Also extract single words
  text = text.replace(/[^a-z0-9\s+#.]/g, ' ');
  
  // Extended stop words - remove common but meaningless words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'will', 'would', 'can', 'this', 'that',
    'it', 'they', 'you', 'we', 'us', 'our', 'your', 'their', 'who', 'what',
    'when', 'where', 'why', 'how', 'all', 'each', 'every', 'some', 'any',
    'such', 'here', 'there', 'then', 'than', 'these', 'those', 'them',
    'about', 'into', 'through', 'over', 'after', 'before', 'between',
    'under', 'above', 'below', 'up', 'down', 'out', 'off', 'again',
    'further', 'once', 'also', 'just', 'now', 'may', 'might', 'must',
    'should', 'could', 'would', 'shall', 'can', 'did', 'does', 'doing',
    'done', 'being', 'having', 'its', 'his', 'her', 'my', 'me', 'him',
    'she', 'he', 'more', 'most', 'other', 'another', 'much', 'many',
    'few', 'several', 'both', 'either', 'neither', 'own', 'same', 'very',
    'too', 'only', 'well', 'even', 'still', 'also', 'yet', 'however',
    'please', 'see', 'get', 'make', 'take', 'give', 'use', 'find', 'tell',
    'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call', 'keep', 'let',
    'begin', 'help', 'show', 'hear', 'play', 'run', 'move', 'like', 'live',
    'believe', 'hold', 'bring', 'happen', 'write', 'provide', 'sit', 'stand',
    'lose', 'pay', 'meet', 'include', 'continue', 'set', 'learn', 'change',
    'lead', 'understand', 'watch', 'follow', 'stop', 'create', 'speak', 'read',
    'allow', 'add', 'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember',
    'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect',
    'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest', 'raise',
    'pass', 'sell', 'require', 'report', 'decide', 'pull', 'return', 'explain',
    'hope', 'develop', 'carry', 'break', 'receive', 'agree', 'support', 'hit',
    'produce', 'eat', 'cover', 'catch', 'draw', 'choose', 'cause', 'point'
  ]);
  
  // Garbage patterns to filter out
  const garbagePatterns = [
    /^www\./,
    /^http/,
    /\.com$/,
    /\.org$/,
    /\.net$/,
    /^[\d.]+$/,  // Only numbers and dots
    /^[^a-z]+$/,  // No letters
    /(.)\1{3,}/,  // Repeated characters (aaaa, 1111)
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/,  // Month abbreviations
    /^(mon|tue|wed|thu|fri|sat|sun)$/,  // Day abbreviations
    /^(am|pm)$/,
    /^(ltd|inc|llc|corp)$/,
    /^(mr|mrs|ms|dr)$/,
    /^(page|pages|pdf|doc|docx)$/,
    /^(click|here|back|next|prev|home)$/,
    /^(menu|login|logout|signup|signin)$/,
    /^(cookie|cookies|privacy|policy|terms|conditions)$/,
    /^(copyright|reserved|rights)$/,
    /^(loading|error|success|warning|info)$/
  ];
  
  // Split into words
  const words = text.split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !stopWords.has(word))
    .filter(word => !/^\d+$/.test(word))
    .filter(word => !garbagePatterns.some(pattern => pattern.test(word)))
    .filter(word => {
      // Must contain at least one letter
      return /[a-z]/.test(word);
    })
    .filter(word => {
      // Filter out words with too many numbers
      const letterCount = (word.match(/[a-z]/g) || []).length;
      const numberCount = (word.match(/[0-9]/g) || []).length;
      return letterCount >= numberCount;
    });
  
  // Combine phrases and words
  const allTerms = [...phrases, ...words];
  
  // Count frequency
  const termCount = {};
  allTerms.forEach(term => {
    termCount[term] = (termCount[term] || 0) + 1;
  });
  
  // Sort by frequency and filter low-frequency noise
  const sortedTerms = Object.entries(termCount)
    .filter(([term, count]) => {
      // Keep terms that appear at least twice OR are longer technical terms
      return count >= 2 || term.length > 10 || term.includes('+') || term.includes('#');
    })
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term);
  
  // Remove duplicates
  const uniqueTerms = [...new Set(sortedTerms)];
  
  console.log('Total unique keywords extracted:', uniqueTerms.length);
  console.log('Top 20 keywords:', uniqueTerms.slice(0, 20));
  
  return uniqueTerms;
}

// Function to calculate compatibility
function calculateCompatibility(jobKeywords, resumeKeywords) {
  console.log('Job keywords count:', jobKeywords.length);
  console.log('Resume keywords count:', resumeKeywords.length);
  
  const jobKeywordsSet = new Set(jobKeywords.slice(0, 100)); // Top 100 keywords
  const resumeKeywordsSet = new Set(resumeKeywords);
  
  // Find exact matches
  const exactMatches = [...jobKeywordsSet].filter(keyword => 
    resumeKeywordsSet.has(keyword)
  );
  
  // Find partial matches (for multi-word terms)
  const partialMatches = [];
  jobKeywordsSet.forEach(jobKeyword => {
    if (!exactMatches.includes(jobKeyword)) {
      const jobWords = jobKeyword.split(/\s+/);
      const hasPartialMatch = resumeKeywords.some(resumeKeyword => {
        return jobWords.some(word => resumeKeyword.includes(word) && word.length > 3);
      });
      if (hasPartialMatch) {
        partialMatches.push(jobKeyword);
      }
    }
  });
  
  const allMatches = [...exactMatches, ...partialMatches];
  
  // Find missing keywords
  const missingKeywords = [...jobKeywordsSet].filter(keyword => 
    !allMatches.includes(keyword)
  );
  
  console.log('Exact matches:', exactMatches.length);
  console.log('Partial matches:', partialMatches.length);
  console.log('Missing keywords:', missingKeywords.length);
  
  // Calculate score
  const compatibilityScore = jobKeywordsSet.size > 0
    ? (allMatches.length / jobKeywordsSet.size) * 100
    : 0;
  
  return {
    score: Math.round(compatibilityScore),
    matchingKeywords: allMatches.slice(0, 30),
    missingKeywords: missingKeywords.slice(0, 30),
    totalJobKeywords: jobKeywordsSet.size,
    totalMatchingKeywords: allMatches.length
  };
}

// Main API endpoint
app.post('/api/check-compatibility', upload.single('resume'), async (req, res) => {
  try {
    const { jobLink } = req.body;
    const resumeFile = req.file;
    
    if (!jobLink || !resumeFile) {
      return res.status(400).json({ 
        error: 'Both job link and resume file are required' 
      });
    }
    
    console.log('\n=== Starting Analysis ===');
    console.log('Job Link:', jobLink);
    console.log('Resume File:', resumeFile.originalname);
    
    console.log('\n--- Extracting text from job link ---');
    const jobText = await extractTextFromURL(jobLink);
    
    if (!jobText || jobText.length < 100) {
      return res.status(400).json({
        error: 'Could not extract sufficient text from the job link. Please try a different URL.'
      });
    }
    
    console.log('\n--- Extracting text from resume ---');
    let resumeText;
    const fileExtension = resumeFile.originalname.split('.').pop().toLowerCase();
    
    if (fileExtension === 'pdf') {
      resumeText = await extractTextFromPDF(resumeFile.buffer);
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      resumeText = await extractTextFromDOCX(resumeFile.buffer);
    } else {
      return res.status(400).json({ 
        error: 'Unsupported file format. Please upload PDF or DOCX' 
      });
    }
    
    if (!resumeText || resumeText.length < 100) {
      return res.status(400).json({
        error: 'Could not extract sufficient text from the resume. Please check your file.'
      });
    }
    
    console.log('\n--- Extracting keywords ---');
    const jobKeywords = extractKeywords(jobText);
    const resumeKeywords = extractKeywords(resumeText);
    
    console.log('\n--- Calculating compatibility ---');
    const compatibility = calculateCompatibility(jobKeywords, resumeKeywords);
    
    console.log('\n=== Analysis Complete ===');
    console.log('Final Score:', compatibility.score + '%');
    
    res.json({
      success: true,
      compatibility: compatibility
    });
    
  } catch (error) {
    console.error('\n!!! Error !!!', error);
    res.status(500).json({ 
      error: error.message || 'An error occurred while processing your request' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});