# Conditional Questionnaire Flow Implementation

## Issue Discovered During Testing

**Date**: During bathroom aids testing
**Reporter**: User testing

### Problem

The questionnaire was showing ALL questions in a category simultaneously, even when some questions should only appear based on previous answers:

**Example - Bathroom Aids:**
1. User selects "Dusche" (shower)
2. Questionnaire shows "Welche Art von Duschsitz bevorzugen Sie?" ✅ (correct)
3. **BUT also shows** "Elektrisch betrieben / Ohne Strom?" ❌ (wrong - only for bathtubs!)
4. User could select "Elektrisch betrieben" even though showers are never electric

**Impact**:
- Confusing UX: Users see irrelevant questions
- Invalid selections possible
- Display showed incompatible criteria (fixed separately)
- Users expected electric products but none existed for showers

## Root Cause

**File**: `src/components/QuestionFlow.jsx`

The component showed ALL questions in a category:
```javascript
// OLD CODE (buggy)
const questions = getQuestionsForCategory(activeCategory);

// This showed ALL questions at once:
questions.map((question) => (
  <QuestionCard key={question.id} ... />
))
```

**Why This Happened**:
- Component didn't implement the `leads_to` logic from the decision tree
- All questions were rendered simultaneously
- No conditional flow based on user answers
- The `leads_to` property in question options was completely ignored

## Solution

Implemented a **dynamic question sequence builder** that respects the `leads_to` logic:

### Key Changes

**1. Added `buildQuestionSequence()` function** (lines 14-59)

```javascript
function buildQuestionSequence(category, answers) {
  const allQuestions = questionFlow[category] ?? [];
  if (allQuestions.length === 0) return [];
  
  const questionMap = {};
  allQuestions.forEach(q => {
    questionMap[q.id] = q;
  });
  
  const sequence = [];
  const visited = new Set();
  
  // Start with the first question
  let currentQuestion = allQuestions[0];
  
  while (currentQuestion && !visited.has(currentQuestion.id)) {
    visited.add(currentQuestion.id);
    sequence.push(currentQuestion);
    
    // Get user's answer for this question
    const answer = answers[currentQuestion.id];
    
    // If no answer yet, stop here (this is the current question)
    if (!answer) break;
    
    // Find the selected option and follow its leads_to
    let nextQuestionId = null;
    
    if (currentQuestion.type === 'single-choice') {
      const selectedOption = currentQuestion.options.find(opt => opt.value === answer);
      nextQuestionId = selectedOption?.leads_to;
    } else if (currentQuestion.type === 'multiple-choice' && Array.isArray(answer) && answer.length > 0) {
      const firstSelectedOption = currentQuestion.options.find(opt => answer.includes(opt.value));
      nextQuestionId = firstSelectedOption?.leads_to;
    }
    
    // If no leads_to specified, we've reached the end
    if (!nextQuestionId) break;
    
    // Move to the next question
    currentQuestion = questionMap[nextQuestionId];
  }
  
  return sequence;
}
```

**How It Works**:
1. Starts with the first question in the category
2. Adds it to the sequence
3. Checks if the user has answered it
4. If yes, follows the `leads_to` from the selected option
5. Repeats until no answer or no `leads_to` (end of flow)
6. Returns only the questions that should be visible

**2. Updated component to use dynamic sequence** (line 88)

```javascript
// NEW CODE (fixed)
const questions = buildQuestionSequence(activeCategory, answers);
```

**3. Improved validation logic** (lines 106-132)

```javascript
const handleNext = () => {
  // Check if all required questions are answered
  const allAnswered = questions.every((question) => {
    const answer = answers[question.id];
    // Single-choice: must have an answer
    if (question.type === 'single-choice') {
      return Boolean(answer);
    }
    // Multiple-choice: having an empty array is OK (means no features selected)
    if (question.type === 'multiple-choice') {
      return Array.isArray(answer);
    }
    return Boolean(answer);
  });
  
  if (!allAnswered) {
    setShowValidation(true);
    setScreenReaderMessage('Bitte beantworten Sie alle Fragen, bevor Sie fortfahren.');
    return;
  }
  // ... continue
};
```

**4. Initialize multiple-choice questions** (lines 91-105)

```javascript
// Initialize multiple-choice questions with empty arrays if they appear in the sequence
useEffect(() => {
  const needsInitialization = questions.some(q => 
    q.type === 'multiple-choice' && answers[q.id] === undefined
  );
  
  if (needsInitialization) {
    const newAnswers = { ...answers };
    questions.forEach(q => {
      if (q.type === 'multiple-choice' && newAnswers[q.id] === undefined) {
        newAnswers[q.id] = [];
      }
    });
    setAnswers(newAnswers);
  }
}, [questions, answers]);
```

**5. Added debug logging** (lines 99-103)

```javascript
console.log('[QuestionFlow] Answer changed:', questionId, '=', value);
console.log('[QuestionFlow] Building new sequence for category:', activeCategory);
const newSequence = buildQuestionSequence(activeCategory, newAnswers);
console.log('[QuestionFlow] New question sequence:', newSequence.map(q => q.id));
```

## Expected Behavior After Fix

### Bathroom Shower Path:
1. Q1: "Wo brauchen Sie Unterstützung?" → **User selects: "Dusche"**
2. Q2: "Welche Art von Duschsitz?" → **User selects: "Wandmontiert"**
3. Q3: "Zusätzliche Eigenschaften?" → **User selects: "Mit Rückenlehne"**
4. ✅ **DONE** - Only 3 questions shown

**NOT shown**: "Elektrisch betrieben?" (correctly hidden) ✅

### Bathroom Bathtub Lift Path:
1. Q1: "Wo brauchen Sie Unterstützung?" → **User selects: "Badewanne (Lift)"**
2. Q2: "Was ist Ihnen wichtig?" → **User selects: "Elektrisch betrieben"** ✅
3. Q3: "Zusätzliche Eigenschaften?" → **User selects features**
4. ✅ **DONE** - Only 3 questions shown

**NOT shown**: "Welche Art von Duschsitz?" (correctly hidden) ✅

## Question Flow Examples

### Vision Aids (Sehhilfen):
```
bathroom_location → (if shower) → bathroom_shower_type → bathroom_features
                 → (if bathtub) → bathroom_bathtub_features → bathroom_features
                 → (if toilet) → bathroom_features
```

### Hearing Aids (Hörgeräte):
```
hearing_level → hearing_device_type → hearing_features → hearing_situations
```

### Mobility Aids (Gehhilfen):
```
mobility_level → mobility_device_type → mobility_features → mobility_usage
```

### Vision Aids (Sehhilfen):
```
vision_type → vision_strength → vision_astigmatism
```

## Technical Benefits

1. **Dynamic Rendering**: Questions appear/disappear based on answers
2. **Clean UX**: Users only see relevant questions
3. **Proper Validation**: Only validates questions that should be answered
4. **Flexible**: Works for any category with `leads_to` logic
5. **Debuggable**: Console logs show question sequence changes
6. **Safe**: Prevents infinite loops with `visited` set

## Testing Verification

After fix, verify for each category:

**Bathroom:**
- [ ] Select "Dusche" → See "Duschsitz type" → NOT see "Elektrisch"
- [ ] Select "Badewanne (Lift)" → See "Elektrisch/Manual" → NOT see "Duschsitz type"
- [ ] Select "Badewanne (Einstieg)" → See "Elektrisch/Manual" → NOT see "Duschsitz type"
- [ ] Select "Toilette" → Skip directly to features

**Hearing:**
- [ ] Each severity level leads to device type question
- [ ] Device type leads to features question
- [ ] Features leads to situations question

**Mobility:**
- [ ] Support level leads to device type
- [ ] Device type leads to features
- [ ] Features leads to usage

**Vision:**
- [ ] Type leads to strength
- [ ] Strength leads to astigmatism
- [ ] All 3 questions always shown (linear path)

## Console Output Example

When testing, you should see in the browser console:

```
[QuestionFlow] Answer changed: bathroom_location = shower
[QuestionFlow] Building new sequence for category: bathroom
[QuestionFlow] New question sequence: ['bathroom_location', 'bathroom_shower_type']

[QuestionFlow] Answer changed: bathroom_shower_type = wall_mounted
[QuestionFlow] Building new sequence for category: bathroom
[QuestionFlow] New question sequence: ['bathroom_location', 'bathroom_shower_type', 'bathroom_features']
```

Notice how `bathroom_bathtub_features` is **never** in the sequence for shower selections! ✅

## Files Modified

1. `src/components/QuestionFlow.jsx` - Implemented conditional question flow

## Known Issue: Flickering When Changing First Answer

**Problem**: When changing the first answer, the UI would flicker rapidly due to an infinite render loop.

**Root Cause**: A useEffect that watched both `questions` and `answers` created a circular dependency:
1. User changes answer → `answers` updates
2. `questions` recalculates (depends on `answers`)
3. useEffect sees `questions` changed → updates `answers` 
4. Back to step 2 → infinite loop

**Solution**: 
- Removed the problematic useEffect
- Moved initialization and cleanup logic into `handleAnswerChange`
- All state updates now happen in a single `setAnswers` call
- Clear irrelevant answers when the question path changes
- Initialize multiple-choice questions only when they enter the sequence

**Code Fix** (lines 94-126):
```javascript
const handleAnswerChange = (questionId, value) => {
  const newAnswers = { ...answers, [questionId]: value };
  
  // Build new sequence based on the updated answer
  const newSequence = buildQuestionSequence(activeCategory, newAnswers);
  const newQuestionIds = new Set(newSequence.map(q => q.id));
  
  // Get all question IDs from the current category (for cleanup)
  const allCategoryQuestions = getQuestionsForCategory(activeCategory);
  const allCategoryQuestionIds = new Set(allCategoryQuestions.map(q => q.id));
  
  // Clear answers for questions in this category that are no longer in the sequence
  Object.keys(newAnswers).forEach(key => {
    if (allCategoryQuestionIds.has(key) && !newQuestionIds.has(key)) {
      console.log('[QuestionFlow] Clearing irrelevant answer:', key);
      delete newAnswers[key];
    }
  });
  
  // Initialize multiple-choice questions that appear in the new sequence
  newSequence.forEach(q => {
    if (q.type === 'multiple-choice' && newAnswers[q.id] === undefined) {
      newAnswers[q.id] = [];
    }
  });
  
  console.log('[QuestionFlow] Answer changed:', questionId, '=', value);
  console.log('[QuestionFlow] New question sequence:', newSequence.map(q => q.id));
  
  // Single state update - no cascading re-renders!
  setAnswers(newAnswers);
  setShowValidation(false);
};
```

**Benefits**:
- ✅ No more flickering
- ✅ Clean answer state (irrelevant answers removed)
- ✅ Single render per user action
- ✅ Better performance

## Status

✅ **FIXED** - Questionnaire now dynamically shows/hides questions based on `leads_to` logic
✅ **FIXED** - Flickering issue resolved by removing circular dependency

