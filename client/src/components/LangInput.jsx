// LangInput.jsx (or LangInput.js)
import React, { useState, useRef, useEffect } from "react";

/**
 * Fetches Odia transliteration suggestions from Google Input Tools.
 * @param {string} word The English word to transliterate.
 * @returns {Promise<string[][]>} A promise that resolves to an array of suggestions,
 *                                each being an array [odiaSuggestion, originalEnglishWord],
 *                                or [[originalEnglishWord, originalEnglishWord]] on failure.
 */
export const getTransliterateSuggestions = async (word) => {
  // Ensure word is not empty or just spaces to avoid unnecessary requests
  if (!word || !word.trim()) {
    return Promise.resolve([[word, word]]);
  }
  const url = `https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=or-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;
  try {
    const res = await fetch(url);
    // Check if the response is ok (status code 200-299)
    if (!res.ok) {
      console.error("Transliteration request failed with status:", res.status);
      return [[word, word]];
    }
    const data = await res.json();
    // Validate the structure of the successful response
    return data && data[0] === "SUCCESS" && Array.isArray(data[1]?.[0]?.[1])
      ? data[1][0][1].map((odiaSuggestion) => [odiaSuggestion, word]) // [["Odia", "English"]]
      : [[word, word]]; // Return original word if response format is unexpected
  } catch (e) {
    console.error("Transliteration fetch error:", e);
    return [[word, word]]; // Return original word on network/parsing error
  }
};

/**
 * @typedef {object} LangInputProps
 * @property {string} value The current value of the input (can be English or "Odia - English").
 * @property {(text: string) => void} onChange Callback function triggered when the input value should change.
 * @property {string} [className] Optional additional CSS classes for the input element.
 * @property {string} [placeholder] Optional placeholder text for the input.
 * @property {boolean} [isRequired] Optional flag to mark the input as required.
 */

/**
 * An input component that provides Odia transliteration suggestions for English text.
 * @param {LangInputProps} props The component props.
 * @returns {React.ReactElement} The LangInput component.
 */
const LangInput = ({
  value,
  onChange,
  className = "",
  placeholder = "Enter text in English", // Adjusted placeholder
  isRequired = false,
}) => {
  const [suggestions, setSuggestions] = useState([]); // No type needed in JS state
  const [lastSelectedEnglish, setLastSelectedEnglish] = useState(""); // Track the English part of the last selection
  const inputRef = useRef(null); // No type needed for ref in JS

  // Extract the English part for fetching suggestions and displaying in input
  // If value is "Odia - English", use "English"; otherwise, use the whole value.
  const englishValue = typeof value === 'string' && value.includes(" - ") ? value.split(" - ")[1] : value;

  // State to manage the input field's displayed text separately
  // This avoids the input showing "Odia - English" when editing
  const [inputValue, setInputValue] = useState(englishValue);

  // Update internal input value when the external value prop changes
  useEffect(() => {
    const currentEnglish = typeof value === 'string' && value.includes(" - ") ? value.split(" - ")[1] : value;
    setInputValue(currentEnglish);
    // Optionally, clear suggestions if the external value was set directly
    // setSuggestions([]);
  }, [value]);


  // Fetch suggestions when the input text changes, debounced slightly
  useEffect(() => {
    // Only fetch if the input value is not empty and wasn't just selected
    if (inputValue && inputValue !== lastSelectedEnglish) {
        // Basic debounce
        const handler = setTimeout(() => {
            getTransliterateSuggestions(inputValue).then(setSuggestions);
        }, 150); // Debounce time in ms (adjust as needed)

        return () => {
            clearTimeout(handler); // Clear timeout if input changes again quickly
        };
    } else {
        setSuggestions([]); // Clear suggestions if input is empty or matches last selection
    }
  }, [inputValue, lastSelectedEnglish]);


  /**
   * Handles changes in the input field.
   * Updates the internal input value state.
   * Calls the parent onChange with the *English* text directly for intermediate typing.
   * Resets the last selected suggestion.
   * @param {React.ChangeEvent<HTMLInputElement>} e The input change event.
   */
  const handleChange = (e) => {
    const currentInput = e.target.value;
    setInputValue(currentInput); // Update the displayed text
    // Decide if parent needs intermediate English value or full value
    // For simplicity here, let's only call parent onChange when suggestion is selected OR input is blurred/submitted
    // OR if you *want* the parent to have the raw english value continuously:
    // onChange(currentInput); // Uncomment this if parent needs live English input
    setLastSelectedEnglish(""); // Allow suggestions for the new text
  };

  /**
   * Handles clicking a suggestion.
   * Calls the parent onChange with the formatted "Odia - English" string.
   * Updates the last selected English part.
   * Clears the suggestions list.
   * Updates the input field display.
   * @param {string} odia The selected Odia suggestion.
   * @param {string} english The corresponding English word.
   */
  const handleSuggestionClick = (odia, english) => {
    const formattedValue = `${odia} - ${english}`;
    onChange(formattedValue); // Update parent state with the final value
    setInputValue(english); // Keep only English in the input field for potential further editing
    setLastSelectedEnglish(english); // Remember what was selected
    setSuggestions([]); // Hide suggestions
    // Optional: focus the input again
    // inputRef.current?.focus();
  };

  // Basic blur handling: if the user clicks away without selecting,
  // pass the current English input value to the parent.
  // This is optional, depending on desired behavior.
  const handleBlur = () => {
       // If the current input value doesn't match the English part of the last *committed* value,
       // and no suggestion was just clicked (lastSelectedEnglish is empty),
       // maybe update the parent with the raw English text?
       const currentExternalEnglish = typeof value === 'string' && value.includes(" - ") ? value.split(" - ")[1] : value;
       if (inputValue !== currentExternalEnglish && !lastSelectedEnglish) {
           // This line depends on whether you want the parent state updated
           // with raw English if the user just types and clicks away.
           // onChange(inputValue);
       }
       // Small delay to allow click event on suggestions to register first
       setTimeout(() => {
            setSuggestions([]);
       }, 100);
  }


  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={inputValue} // Display the potentially temporary English input
        onChange={handleChange}
        onBlur={handleBlur} // Hide suggestions on blur
        className={`px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-amber-500 ${className}`}
        placeholder={placeholder}
        required={isRequired}
        autoComplete="off" // Prevent browser's own suggestions
      />
      {/* Only show suggestions if there are any AND the input has focus (implicitly handled by blur) */}
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Filter might not be strictly needed now due to lastSelectedEnglish check in useEffect */}
          {suggestions.map(([odia, english], idx) => (
              <li
                key={`${english}-${idx}`} // Use a more robust key
                // Use onMouseDown instead of onClick to fire before onBlur
                onMouseDown={() => handleSuggestionClick(odia, english)}
                className="px-3 py-2 cursor-pointer hover:bg-amber-100 text-sm"
              >
                 {odia} <span className="text-gray-500 text-xs">({english})</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default LangInput;