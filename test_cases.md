# Test Cases for AI Governance LLM Prompt Checker

This file contains test prompts to validate the sensitive data detection, attachment checking, and prompt modification features.

## Text Prompts with Sensitive Data (Should Trigger Warning + Suggestion)

### SSN Examples
1. "Can you help me check if my Social Security Number 123-45-6789 is valid?"
   - Expected: Warning + suggestion to use official SSA website

2. "What does this SSN 987-65-4321 mean?"
   - Expected: Warning + rewritten to general SSN question

### Credit Card Examples
3. "Please verify this credit card number: 4111-1111-1111-1111 for me."
   - Expected: Warning + suggestion to use banking website

4. "Is 5555-6666-7777-8888 a valid credit card?"
   - Expected: Warning + redirect to card issuer

### Phone Number Examples
5. "Call me at 555-123-4567 if you need anything."
   - Expected: Warning + rewritten without phone number

6. "What's the area code for 415-555-0199?"
   - Expected: Warning + general area code question

### Multiple Sensitive Data
7. "My SSN is 123-45-6789, phone is 555-987-6543, and credit card ends with 1111."
   - Expected: Warning + rewritten removing all sensitive data

### API Key Examples
8. "Use this API key: sk-1234567890abcdef1234567890abcdef to access the service."
   - Expected: Warning + rewritten without API key

### Banking Info
9. "My bank account number is 123456789 and routing number is 021000021."
   - Expected: Warning + suggestion to use bank website

## Text Prompts without Sensitive Data (Should Not Trigger Warning)

1. "What is the weather like today?"
2. "Explain how machine learning works."
3. "Write a story about a robot."
4. "What are the benefits of exercise?"
5. "How do I bake chocolate chip cookies?"

## Attachment Testing Scenarios

### Images with Sensitive Data
1. **Credit Card Photo**: Upload an image showing a credit card with visible numbers
   - Expected: Warning (no suggestion button for attachments)

2. **ID Document**: Upload a photo of a driver's license or passport
   - Expected: Warning for PII detection

3. **Screenshot with SSN**: Upload a screenshot containing an SSN
   - Expected: Warning

### Images without Sensitive Data
1. **Nature Photo**: Upload a landscape or animal photo
   - Expected: No warning

2. **Chart/Graph**: Upload a business chart or diagram
   - Expected: No warning

## Edge Cases

1. "Tell me about Social Security Numbers in general."
   - Expected: No warning (general topic, no specific data)

2. "What format are credit card numbers in?"
   - Expected: No warning (general question)

3. "My favorite number is 4111111111111111"
   - Expected: Warning (matches credit card pattern)

4. "The test SSN they use in movies is 123-45-6789"
   - Expected: Warning + suggestion

## Expected Behaviors

- **Warning Display**: Red banner with "⚠️ Warning: Sensitive data detected in your prompt/attachment!"
- **Suggestion Button**: For text prompts, "Use Suggested Prompt" button appears
- **Modified Prompts**: Should either remove sensitive data or redirect to official sources
- **Attachment Warnings**: Appear without modification options
- **No False Positives**: General discussions shouldn't trigger warnings

## Testing Instructions

1. Start the server: `uv run python main.py`
2. Load the extension in Chrome
3. Visit a supported LLM site (ChatGPT, Claude, etc.)
4. Test each prompt by typing or pasting
5. For attachments, upload the specified image types
6. Verify console logs and UI responses match expectations