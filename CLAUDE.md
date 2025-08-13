# Claude Assistant Instructions

## Project: GadgetFix Website

## Session Log: January 13, 2025
**Task:** Complete business transformation to software-only services & create premium landing pages

### Work Completed Today:

#### 1. Fixed Critical Build Error
- **Problem:** Build failing with "Expected ';' but found 's'" at fort-worth.astro:10:64
- **Root Cause:** Unescaped apostrophes in "Cook Children's"
- **Solution:** Escaped apostrophes: `Children\'s`, `Texas Health Harris Methodist\'s`
- **Result:** Build successful, deployed to Netlify

#### 2. Blog & FAQ Software Transformation
- **Blog Page Updates:**
  - Title: "Electronics Repair Blog" → "Computer Service Blog"
  - Featured article: smartphone protection → computer security
  - Categories: Device Protection → Security Protection, Repair Tips → Computer Tips
  - All articles now computer-focused
  
- **FAQ Page Updates:**
  - All questions changed from phone repair to computer service
  - "warranty" → "guarantee" language
  - Added virus removal, password reset, optimization FAQs
  - Removed all hardware repair references

#### 3. Comprehensive SEO Transformation
- **Discovery:** 90 files still contained phone/device repair keywords
- **Solution:** Created automated script `update-location-seo.cjs`
- **Results:**
  - Updated 80+ location files
  - 1,000+ keyword replacements
  - Systematic replacements:
    - "phone repair" → "computer service"
    - "iphone repair" → "virus removal" 
    - "samsung repair" → "password reset"
    - "screen replacement" → "computer optimization"
    - "battery replacement" → "software installation"
  - Zero phone repair keywords remaining

#### 4. Premium Landing Pages for Wealthy Areas
**Created 4 targeted pages:**
- `/highland-park-computer-service.astro` - Elite/luxury positioning
- `/university-park-computer-service.astro` - Academic/SMU focus
- `/southlake-computer-service.astro` - Luxury lifestyle focus
- `/plano-west-computer-service.astro` - Corporate professional focus

**Design Issues Fixed:**
- Initially used wrong colors (gold buttons, gradient backgrounds)
- Fixed to match homepage: #1e3a8a hero, #000000 buttons
- Added Windows services (initially only had Mac)
- Removed testimonials section
- Removed all emojis from lifestyle sections

#### 5. Explored Gaming Landing Page (Deleted)
- Created Battlefield 6 secure boot error page
- Researched real pain points (Legacy BIOS, MBR/GPT, TPM 2.0)
- User decided against it, page deleted

### Key Technical Patterns:
- Consistent color scheme: Blue (#1e3a8a) and black (#000000)
- Both Mac AND Windows services on all pages
- No emojis in professional content
- Clean, professional messaging for affluent demographics

### Files Modified:
- 85 files total (4 new pages + 81 existing files updated)
- 1,967 insertions across premium pages
- 1,340 insertions, 1,175 deletions in SEO update

### Important Reminders

1. **UPDATE DEVELOPMENT LOG**: After each significant development session, update `DEVELOPMENT_LOG.md` with:
   - Date of session
   - Problems encountered
   - Solutions implemented
   - Files modified
   - Key learnings
   - Testing results

2. **Form Testing**: After any form modifications, always test:
   - Can users type in fields?
   - Does form submit successfully?
   - Does email arrive at wellz.levi@gmail.com?
   - Check browser console for errors

3. **Lint and Type Check**: Run these commands before committing:
   ```bash
   npm run lint    # If available
   npm run typecheck   # If available
   ```

4. **Spam Protection Stack** (Currently Working):
   - Honeypot fields
   - Rate limiting (30 seconds)
   - AJAX submission
   - Cloudflare Turnstile
   - SpamProtection behavioral tracking

5. **Known Issues to Avoid**:
   - Don't use complex regex validation (breaks form input)
   - BotProtection component has too many false positives
   - Don't implement multiple protection layers at once

6. **Testing Approach**:
   - Always test incrementally
   - One feature at a time
   - Test on localhost before deploying

7. **SEO & Content Guidelines** (Updated 2025-08-12):
   - NO pricing mentions anywhere on site (no dollar amounts, no "free")
   - Use value/urgency focused language instead
   - All service cards should be clickable for user funneling
   - Keep consistent internal linking between service pages
   
8. **Schema Markup Rules**:
   - Only ONE aggregateRating per page (not in Layout.astro)
   - Reviews should not have nested LocalBusiness in itemReviewed
   - Each service page can have its own unique rating
   
9. **Recent Site Structure Changes** (2025-08-12):
   - Homepage: Service cards are clickable, split Windows/Mac cards
   - Service Area Map: Full-width image with 2-column county grid below
   - Locations page: Now includes all 7 counties (added Rockwall, Kaufman, Ellis)
   - Computer services link to `/contact-computer` landing page
   - About page: 8 track record stats, removed redundant service highlights

### Project Structure
- Forms: `/src/pages/contact.astro`, `/src/pages/contact-computer.astro`
- Layout: `/src/layouts/Layout.astro`
- Components: `/src/components/`
- Scripts: `/src/scripts/`

### Key Contacts
- Form submissions go to: wellz.levi@gmail.com
- FormSubmit.co is used for email handling

### Development Workflow
1. Make changes
2. Test locally with `npm run dev`
3. Update DEVELOPMENT_LOG.md
4. Commit with descriptive message
5. Push to repository

---
*This file helps Claude understand project context and requirements*