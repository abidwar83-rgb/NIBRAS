import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function generateBookMetadata(params: {
  title: string;
  author: string;
  category: string;
  shortDescription: string;
}) {
  const ai = getAI();
  if (!ai) {
    // Fallback if API key is not yet set
    return {
      seoTitle: `${params.title} by ${params.author} — Official eBook on Nibras`,
      seoDesc: `${params.title} by ${params.author}. Read the full digital edition in ${params.category} on Nibras eBook marketplace.`,
      keywords: `${params.category.toLowerCase()}, ${params.title.toLowerCase()}, ebook, digital download, read online`,
      audience: `Readers and practitioners interested in ${params.category}.`,
      tags: [params.category.toLowerCase(), "ebook", "bestseller", "reading"]
    };
  }

  const prompt = `You are an expert publishing editor and SEO copywriter for Nibras, a premier eBook marketplace.
Generate structured metadata for the following book:
Title: "${params.title}"
Author: "${params.author}"
Category: "${params.category}"
Notes: "${params.shortDescription}"

Return JSON matching the schema with:
- seoTitle (punchy, high click-through rate, under 60 chars)
- seoDesc (compelling meta description, 140-160 chars)
- keywords (comma-separated relevant keywords)
- audience (who will benefit most from this book)
- tags (list of 4-6 lowercase relevant tags)`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            seoTitle: { type: Type.STRING },
            seoDesc: { type: Type.STRING },
            keywords: { type: Type.STRING },
            audience: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['seoTitle', 'seoDesc', 'keywords', 'audience', 'tags']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (error) {
    console.error('Gemini generateBookMetadata error:', error);
    return {
      seoTitle: `${params.title} by ${params.author} — Nibras eBooks`,
      seoDesc: params.shortDescription.slice(0, 150),
      keywords: `${params.category}, ${params.title}, ebook`,
      audience: "General readers and learners.",
      tags: [params.category.toLowerCase(), "ebook"]
    };
  }
}

export async function askBookAssistant(params: {
  bookTitle: string;
  bookAuthor: string;
  bookContent: string;
  question: string;
  conversationHistory?: Array<{ role: 'user' | 'model'; text: string }>;
}) {
  const ai = getAI();
  if (!ai) {
    return {
      answer: `Based on "${params.bookTitle}" by ${params.bookAuthor}: The text emphasizes structured execution, observing points of friction as diagnostic data, and building consistent compounding mastery. (Configure your GEMINI_API_KEY in Settings > Secrets for dynamic real-time synthesis).`
    };
  }

  const prompt = `You are the Nibras AI Reading Companion, an intelligent tutor that answers questions strictly based on the authorized book text.
Book: "${params.bookTitle}" by ${params.bookAuthor}

AUTHORIZED BOOK CONTENT:
"""
${params.bookContent}
"""

USER QUESTION:
${params.question}

Instructions:
1. Answer directly, clearly, and thoughtfully based on the authorized content above.
2. If the user asks for concepts or chapters present in the text, explain them thoroughly with examples.
3. If the question asks for something not covered in the book content, state clearly what the book mentions and what is outside its scope.
4. Maintain a warm, encouraging, scholarly tone fitting of Nibras ("A lamp for the next chapter").`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    return { answer: response.text || "Unable to generate answer." };
  } catch (error) {
    console.error('Gemini askBookAssistant error:', error);
    throw new Error('AI assistant failed to generate response');
  }
}

export async function summarizeBookOrChapter(params: {
  bookTitle: string;
  bookAuthor: string;
  content: string;
  focus?: string;
}) {
  const ai = getAI();
  if (!ai) {
    return {
      summary: `In "${params.bookTitle}", author ${params.bookAuthor} presents core frameworks for mastery. Key themes include deliberate deceleration when facing friction, recognizing quiet failure modes early, and cultivating compounding knowledge.`,
      takeaways: [
        "Friction is diagnostic data rather than an obstacle.",
        "Systems fail quietly long before outward disruption is noticed.",
        "Small, boring consistent decisions outperform sporadic clever gambits."
      ]
    };
  }

  const prompt = `You are a literary analyst for Nibras.
Summarize the following book material:
Book: "${params.bookTitle}" by ${params.bookAuthor}
${params.focus ? `Focus area: ${params.focus}` : ''}

CONTENT:
"""
${params.content}
"""

Output JSON containing:
- summary: A comprehensive 2-3 paragraph executive summary of the core arguments and narrative.
- takeaways: An array of 4-6 bullet-point actionable takeaways.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            takeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['summary', 'takeaways']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error('Gemini summarize error:', err);
    throw err;
  }
}

export async function explainParagraph(params: {
  bookTitle: string;
  passage: string;
  simplicityLevel?: 'simple' | 'in-depth';
}) {
  const ai = getAI();
  if (!ai) {
    return {
      explanation: `This passage from "${params.bookTitle}" highlights that problems rarely arise overnight; they brew in quiet, overlooked decisions. In simple terms: pay attention to subtle friction early before it turns into a major breakdown.`
    };
  }

  const prompt = `Explain the following excerpt from "${params.bookTitle}" in ${params.simplicityLevel === 'simple' ? 'plain, accessible, jargon-free language suitable for a beginner' : 'depth, providing conceptual context and an illustrative analogy'}:

PASSAGE:
"""
${params.passage}
"""`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    return { explanation: response.text || '' };
  } catch (err) {
    console.error('Gemini explain error:', err);
    throw err;
  }
}

export async function generateQuizQuestions(params: {
  bookTitle: string;
  content: string;
}) {
  const ai = getAI();
  if (!ai) {
    return {
      questions: [
        {
          question: "According to the opening premise, how do most complex systems fail?",
          options: [
            "With an immediate, dramatic explosion",
            "Quietly, long before anyone notices outward noise",
            "Due to external market forces alone",
            "Only when intentional sabotage occurs"
          ],
          correctAnswerIndex: 1,
          explanation: "Chapter 1 emphasizes that systems fail quietly through small overlooked assumptions before visible symptoms manifest."
        },
        {
          question: "How is 'friction' characterized in the text?",
          options: [
            "As an insurmountable barrier to give up on",
            "As diagnostic data revealing underlying misalignment",
            "As proof that the tools used are defective",
            "As something that can always be resolved by rushing faster"
          ],
          correctAnswerIndex: 1,
          explanation: "Friction is viewed as diagnostic data indicating where definitions or expectations are misaligned."
        }
      ]
    };
  }

  const prompt = `Generate an engaging 3-question multiple-choice quiz testing comprehension of this book content:
Book: "${params.bookTitle}"

CONTENT:
"""
${params.content}
"""

Return JSON matching the schema.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ['question', 'options', 'correctAnswerIndex', 'explanation']
              }
            }
          },
          required: ['questions']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error('Gemini quiz error:', err);
    throw err;
  }
}

export async function generateFlashcards(params: {
  bookTitle: string;
  content: string;
}) {
  const ai = getAI();
  if (!ai) {
    return {
      flashcards: [
        {
          front: "What is the primary indicator of invisible debt in systems?",
          back: "The accumulation of unverified assumptions creating brittleness beneath seemingly stable facades."
        },
        {
          front: "Why does the author advocate for 'deliberate deceleration'?",
          back: "To examine stress points, clarify muddy definitions, and align unstated expectations."
        },
        {
          front: "How does compounding apply to personal knowledge?",
          back: "Just as capital earns interest upon interest, mental models strengthen exponentially when connected across diverse domains."
        }
      ]
    };
  }

  const prompt = `Generate 4 high-yield study flashcards from this book excerpt:
Book: "${params.bookTitle}"

CONTENT:
"""
${params.content}
"""

Return JSON with an array of objects containing 'front' (question/prompt) and 'back' (concise clear answer).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING }
                },
                required: ['front', 'back']
              }
            }
          },
          required: ['flashcards']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error('Gemini flashcards error:', err);
    throw err;
  }
}

export async function translatePassage(params: {
  text: string;
  targetLanguage: string;
}) {
  const ai = getAI();
  if (!ai) {
    return {
      translatedText: `[Translation to ${params.targetLanguage}]: ${params.text}`
    };
  }

  const prompt = `Translate the following literary/technical passage into ${params.targetLanguage}.
Ensure the tone is elegant, accurate, and natural in the target language. Preserve any formatting and line breaks.

PASSAGE:
"""
${params.text}
"""`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    return { translatedText: response.text || '' };
  } catch (err) {
    console.error('Gemini translate error:', err);
    throw err;
  }
}

export async function semanticBookSearch(params: {
  query: string;
  books: Array<{ id: string; title: string; author: string; category: string; description: string; tags: string[] }>;
}) {
  const ai = getAI();
  if (!ai) {
    // Simple text matching fallback
    const q = params.query.toLowerCase();
    const matches = params.books
      .filter(b => (b.title + ' ' + b.description + ' ' + b.tags.join(' ')).toLowerCase().includes(q))
      .map(b => ({ id: b.id, relevanceScore: 0.9, reason: "Matched keyword search" }));
    return { matches };
  }

  const prompt = `Given the user query: "${params.query}"
And this library catalog of books:
${JSON.stringify(params.books.map(b => ({ id: b.id, title: b.title, author: b.author, category: b.category, tags: b.tags, description: b.description.slice(0, 120) })), null, 2)}

Identify the best matching books (up to 5) based on conceptual meaning, intent, and reader goals.
Return JSON with 'matches': array of objects containing 'id', 'relevanceScore' (number 0 to 1), and 'reason' (one sentence explanation).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  relevanceScore: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                },
                required: ['id', 'relevanceScore', 'reason']
              }
            }
          },
          required: ['matches']
        }
      }
    });

    return JSON.parse(response.text || '{ "matches": [] }');
  } catch (err) {
    console.error('Gemini search error:', err);
    return { matches: [] };
  }
}
