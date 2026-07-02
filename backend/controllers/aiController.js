import { GoogleGenAI } from '@google/genai';

const isApiKeyConfigured = () => {
  const key = process.env.GEMINI_API_KEY;
  return key && key !== 'YOUR_GEMINI_API_KEY' && key.trim().length > 0;
};

const ai = new GoogleGenAI({
  apiKey: isApiKeyConfigured() ? process.env.GEMINI_API_KEY : 'mock-key',
});

const generateFromModel = async (model, prompt) => {
  return ai.models.generateContent({
    model,
    contents: prompt,
  });
};

export const generateBlogContent = async (req, res) => {
  try {
    const { title, subtitle } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!isApiKeyConfigured()) {
      console.warn('Gemini API key is not configured. Returning mock blog content.');
      const mockContent = `<p>Artificial Intelligence (AI) is rapidly transitioning from a futurist concept to an indispensable tool in modern healthcare. By analyzing vast datasets, clinical patterns, and high-resolution medical imaging, machine learning algorithms are empowering doctors to make faster, more accurate diagnoses.</p>
<h4>Revolutionizing Diagnosis and Imaging</h4>
<p>One of the most mature applications of healthcare AI is in diagnostic radiology. Automated systems can now detect subtle abnormalities in X-rays, MRIs, and CT scans—sometimes identifying early-stage tumors or cardiovascular risks before they are visible to the human eye. This doesn't replace radiologists but rather serves as a powerful second set of eyes, reducing diagnostic errors and acceleration processing time.</p>
<h4>Accelerating Drug Discovery</h4>
<p>Developing a new therapeutic drug traditionally takes over a decade and billions of dollars. AI is reshaping this pipeline by simulating molecular interactions and predicting which compounds are most likely to bind successfully to target proteins. What once took years of laboratory trial-and-error can now be narrowed down in silico within weeks, drastically reducing time-to-market for life-saving treatments.</p>
<h4>Enhancing Operational Workflows</h4>
<p>Beyond clinical diagnostics, AI is streamlining the administrative burden on hospitals. Predictive models forecast patient admission rates, helping administrators optimize staffing schedules and bed availability. Natural language processing (NLP) tools also transcribe clinician-patient conversations directly into electronic health records, allowing doctors to spend less time typing and more time engaging with patients.</p>`;
      return res.json({ content: mockContent });
    }

    const prompt = `
Write a high-quality blog post.

Title: "${title}"
Subtitle: "${subtitle || ''}"

Guidelines:
- Clear introduction
- Use headings and subheadings
- Professional but engaging tone
- Practical examples if useful
- Around 600–800 words
- Plain text only (no markdown)
`;

    let response;

    try {
      // 🔹 Primary (fast, but may overload)
      response = await generateFromModel('gemini-2.5-flash', prompt);
    } catch (err) {
      if (err.status === 503) {
        // 🔹 Fallback (more stable)
        response = await generateFromModel('gemini-1.5-flash', prompt);
      } else {
        throw err;
      }
    }

    res.json({ content: response.text });
  } catch (error) {
    console.error('Gemini Error:', error);

    res.status(503).json({
      message:
        'AI is currently busy. Please try again in a few seconds.',
    });
  }
};

export const suggestTags = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and Content are required' });
    }

    if (!isApiKeyConfigured()) {
      console.warn('Gemini API key is not configured. Returning mock tags.');
      return res.json({ tags: ['tech', 'health', 'ai', 'innovation'] });
    }

    const prompt = `
Analyze the following blog post title and content, and suggest 3-5 relevant, lowercase, single-word category tags (like tech, travel, science, design).

Title: "${title}"
Content: "${content.replace(/<[^>]*>/g, '').substring(0, 1500)}"

Return ONLY a comma-separated list of tags, nothing else. E.g. "tech, programming, webdev"
`;

    let response;
    try {
      response = await generateFromModel('gemini-2.5-flash', prompt);
    } catch (err) {
      if (err.status === 503 || err.status === 404) {
        response = await generateFromModel('gemini-1.5-flash', prompt);
      } else {
        throw err;
      }
    }

    const tagsText = response.text || '';
    const tags = tagsText
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag && tag.length > 0);

    res.json({ tags });
  } catch (error) {
    console.error('Gemini Suggest Tags Error:', error);
    res.status(503).json({
      message: 'AI is currently busy. Please try again in a few seconds.',
    });
  }
};

export const summarizePost = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required for summary' });
    }

    if (!isApiKeyConfigured()) {
      console.warn('Gemini API key is not configured. Returning mock summary.');
      const mockSummary = `- Artificial Intelligence is transforming diagnostic medicine by analyzing imaging data to identify early anomalies.
- Machine learning simulations drastically shorten the timeline for drug discovery and molecular research.
- Hospital operational efficiency is improved through automated staffing forecasts and natural language chart transcription.`;
      return res.json({ summary: mockSummary });
    }

    const prompt = `
Read and summarize the following blog post. Provide a high-quality, engaging summary in 3-4 bullet points.

Title: "${title || ''}"
Content: "${content.replace(/<[^>]*>/g, '').substring(0, 4000)}"

Guidelines:
- Clear actionable bullet points
- Keep it concise (around 100-150 words total)
- Plain text only (no markdown, just bullet points starting with "-")
`;

    let response;
    try {
      response = await generateFromModel('gemini-2.5-flash', prompt);
    } catch (err) {
      if (err.status === 503 || err.status === 404) {
        response = await generateFromModel('gemini-1.5-flash', prompt);
      } else {
        throw err;
      }
    }

    res.json({ summary: response.text || '' });
  } catch (error) {
    console.error('Gemini Summarize Error:', error);
    res.status(503).json({
      message: 'AI is currently busy. Please try again in a few seconds.',
    });
  }
};
