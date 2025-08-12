# Claude Assistant Instructions

## Project: GadgetFix Website

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