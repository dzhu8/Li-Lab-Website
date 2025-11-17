# Li Lab Website

This is the website for the Li Lab at Whitehead Institute & MIT.

## Adding Lab Members and Alumni

To add current lab members or alumni to the About page (`layouts/about.html`):

1. **Prepare the photo** (optional):
   - Place a photo file (e.g., `john.jpg`) in the `assets/` folder.

2. **Edit the About page**:
   - Open `layouts/about.html`.

3. **For Current Members**:
   - Find the `members` array in the JavaScript section (around line 70-90 as of 11/16/2025).
   - Add a new object to the array in the format:
     ```javascript
     { name: 'Full Name', bio: 'Brief bio or description.', img: 'filename.jpg' }
     ```
   - If no photo, omit the `img` property or set it to `undefined`.

4. **For Alumni**:
   - Find the `alumni` array in the JavaScript section (around line 130-140 as of 11/16/2025).
   - Add a new object in the same format as above.

5. **Save and refresh**:
   - Save the file.
   - Refresh the About page in your browser to see the changes.

Example:
```javascript
const members = [
    { name: 'John Doe', bio: 'PhD student working on XYZ.', img: 'john.jpg' },
    // ... other members
];
```

## Adding Publications

To add publications to the Publications page (`src/layouts/publications.html`):

1. **Prepare the PDF** (optional but recommended):
   - Save the publication PDF to `src/assets/papers/` (e.g., `smith-2024.pdf`)

2. **Edit the Publications page**:
   - Open `src/layouts/publications.html`
   - Find the comment `// Add publications here` (around line 220 as of 11/16/2025)

3. **Add a publication entry**:
   - Use the `addPublication()` function with the following template:

   ```javascript
   addPublication({
       year: 2024,                    // Publication year
       title: 'Full Paper Title',    // Complete title of the paper
       journal: 'Nature',             // Journal name
       authors: 'Smith J, Doe A, Li P', // Author list (comma-separated)
       date: 'March 15, 2024',        // Publication date
       desc: 'Brief description or abstract excerpt...', // Description
       pdf: '../assets/papers/smith-2024.pdf',  // Path to PDF (optional)
       imgUrl: '../assets/papers/smith-2024-thumbnail.jpg', // Thumbnail image (optional)
       pmid: '12345678',              // PubMed ID (optional, use pmid OR link)
       link: 'https://doi.org/...'    // DOI or other URL (optional, use pmid OR link)
   });
   ```

4. **Field descriptions**:
   - `year` (required): Year the paper was published
   - `title` (required): Full title of the publication
   - `journal` (optional): Name of the journal
   - `authors` (optional): Comma-separated list of authors
   - `date` (optional): Publication date (any format)
   - `desc` (optional): Brief description or abstract
   - `pdf` (optional): Relative path to PDF file
   - `imgUrl` (optional): Relative path to thumbnail image (800x800px recommended)
   - `pmid` (optional): PubMed ID - creates automatic link to PubMed
   - `link` (optional): Direct URL or DOI - use if no PMID available

5. **Thumbnail options**:
   - If `imgUrl` is provided, it displays as a clickable image
   - If only `pdf` is provided, the first page of the PDF is shown
   - If neither is provided, a placeholder is shown

6. **Example with all fields**:
   ```javascript
   addPublication({
       year: 2024,
       title: 'Diffusion barriers imposed by tissue topology shape Hedgehog morphogen gradients',
       journal: 'PNAS',
       authors: 'Gavin Schlissel, Miram Meziane, Domenic Narducci, Anders S. Hansen, Pulin Li',
       date: 'July 15, 2024',
       desc: 'Here, we used single-molecule imaging in reconstituted morphogen gradients...',
       pdf: '../assets/papers/schlissel-et-al-2024.pdf',
       pmid: '39190357'
   });
   ```

7. **Example with minimal fields**:
   ```javascript
   addPublication({
       year: 2023,
       title: 'A Study on XYZ',
       authors: 'Doe J, Smith A',
       link: 'https://doi.org/10.1234/example'
   });
   ```

8. **Save and test**:
   - Save `publications.html`
   - Refresh the Publications page in your browser
   - Publications are automatically sorted by year (newest first)
