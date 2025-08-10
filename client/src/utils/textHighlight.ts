/**
 * Utility functions for highlighting search terms in text
 */

/**
 * Highlights matching text in a string by wrapping matches with HTML spans
 * @param text - The text to search in
 * @param searchTerm - The term to highlight
 * @returns HTML string with highlighted text
 */
export function highlightText(text: string, searchTerm: string): string {
  if (!text || !searchTerm) {
    return text || '';
  }

  // Escape special regex characters in search term
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create regex for case-insensitive matching with global flag
  const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
  
  // Replace matches with highlighted spans
  return text.replace(regex, '<span class="bg-yellow-200 font-semibold">$1</span>');
}

/**
 * Checks if a text contains the search term (case-insensitive)
 * @param text - The text to search in
 * @param searchTerm - The term to search for
 * @returns boolean indicating if match exists
 */
export function containsSearchTerm(text: string, searchTerm: string): boolean {
  if (!text || !searchTerm) {
    return false;
  }
  
  return text.toLowerCase().includes(searchTerm.toLowerCase());
}

/**
 * Highlights search term in multiple fields of a contact
 * @param contact - The contact object
 * @param searchTerm - The term to highlight
 * @returns object with highlighted versions of contact fields
 */
export function highlightContactFields(contact: any, searchTerm: string) {
  if (!searchTerm) {
    return {
      name: contact.NAME || '',
      company: contact.PARENTCONTACTNAME || '',
      position: (contact.JOBTITLE || contact.TITLE) || '',
      city: contact.CITY || '',
      email: contact.emails?.[0]?.EMAIL || '',
      phone: contact.phones?.[0]?.NUMBER || ''
    };
  }

  return {
    name: highlightText(contact.NAME || '', searchTerm),
    company: highlightText(contact.PARENTCONTACTNAME || '', searchTerm),
    position: highlightText((contact.JOBTITLE || contact.TITLE) || '', searchTerm),
    city: highlightText(contact.CITY || '', searchTerm),
    email: contact.emails?.[0]?.EMAIL ? highlightText(contact.emails[0].EMAIL, searchTerm) : '',
    phone: contact.phones?.[0]?.NUMBER ? highlightText(contact.phones[0].NUMBER, searchTerm) : ''
  };
}