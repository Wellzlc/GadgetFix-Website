# Procedures Manual
> Step-by-step operational procedures for the GadgetFix Website
> Established: January 16, 2025

## 📖 Manual Purpose

This manual provides detailed, step-by-step procedures for all common and critical operations. Follow these procedures exactly to ensure consistency and prevent errors.

## 🚀 Quick Start Procedures

### Starting Development Session

1. **Open Project**
   ```bash
   cd C:\Users\Levi\GadgetFix-Website
   ```

2. **Check Git Status**
   ```bash
   git status
   ```

3. **Start Dev Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   - Navigate to http://localhost:4321

5. **Check Console**
   - Open DevTools (F12)
   - Check for errors

6. **Update Todo List**
   - Create session tasks
   - Track progress

### Ending Development Session

1. **Run Tests** (if available)
   ```bash
   npm run lint
   npm run typecheck
   ```

2. **Update Documentation**
   - Update DEVELOPMENT_LOG.md
   - Update relevant tracking docs

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "Descriptive message"
   ```

4. **Push to Repository**
   ```bash
   git push origin main
   ```

## 🔧 Common Operations

### Adding a New Service Page

1. **Create Page File**
   - Location: `/src/pages/[service-name].astro`
   - Copy template from existing service page

2. **Update Content**
   - Change title and description
   - Update service details
   - Modify schema markup

3. **Add Navigation**
   - Update menu in Layout.astro if needed
   - Add internal links from related pages

4. **Configure SEO**
   - Set meta tags
   - Add schema markup
   - NO aggregateRating in Layout.astro

5. **Test Page**
   - Check localhost
   - Validate schema
   - Test responsive design
   - Check console for errors

6. **Deploy**
   - Commit changes
   - Push to repository
   - Verify on production

### Fixing Schema Errors

1. **Identify Error**
   - Check Google Search Console
   - Note specific error message

2. **Locate Duplicate Schema**
   ```bash
   grep -r "aggregateRating" src/
   ```

3. **Remove Duplicates**
   - Keep ONLY page-level schema
   - Remove from Layout.astro

4. **Validate Fix**
   - Use Google Rich Results Test
   - Check each affected page

5. **Document Fix**
   - Update FIX_REGISTRY.md
   - Update ISSUE_TRACKER.md

### Updating Contact Forms

1. **Backup Current Form**
   - Copy existing code
   - Save to backup file

2. **Make Changes Incrementally**
   - One change at a time
   - Test after each change

3. **Test Thoroughly**
   - Can type in fields?
   - Form submits?
   - Email received?
   - No console errors?

4. **Critical Checks**
   - Honeypot field hidden
   - Rate limiting works
   - AJAX submission functional

5. **Document Changes**
   - What was changed
   - Why it was changed
   - Testing results

### Deploying to Production

1. **Pre-deployment Checks**
   - [ ] All tests passing
   - [ ] No console errors
   - [ ] Forms tested
   - [ ] SEO validated
   - [ ] Performance acceptable

2. **Create Production Build**
   ```bash
   npm run build
   ```

3. **Test Build Locally**
   ```bash
   npm run preview
   ```

4. **Deploy via Git**
   ```bash
   git add .
   git commit -m "Deploy: [description]"
   git push origin main
   ```

5. **Post-deployment Verification**
   - Check Netlify dashboard
   - Test live site
   - Verify forms work
   - Check for errors

## 🚨 Emergency Procedures

### Site is Down

1. **Verify Issue**
   - Check from multiple devices
   - Check Netlify status page

2. **Check Netlify Dashboard**
   - Look for failed builds
   - Check error logs

3. **Rollback if Needed**
   - Use Netlify's instant rollback
   - Or revert last commit

4. **Document Incident**
   - Time of outage
   - Cause identified
   - Resolution steps
   - Prevention measures

### Build Failing

1. **Check Error Message**
   - Read full error output
   - Identify failing file

2. **Common Fixes**
   - Syntax errors (missing semicolons, quotes)
   - Import errors (wrong paths)
   - Dependency issues (npm install)

3. **Test Locally**
   ```bash
   npm run build
   ```

4. **Fix and Retry**
   - Fix identified issue
   - Test locally first
   - Push fix to repository

### Form Not Working

1. **Test Submission**
   - Fill out form
   - Submit
   - Check email

2. **Check Console**
   - Look for JavaScript errors
   - Check network tab

3. **Verify Configuration**
   - FormSubmit.co endpoint correct
   - Email address correct
   - No validation blocking input

4. **Test Components**
   - Honeypot field
   - Rate limiting
   - AJAX submission

## 📋 Checklists

### New Feature Checklist
- [ ] Requirement clear
- [ ] Similar feature exists?
- [ ] Design approved
- [ ] Implementation planned
- [ ] Tests written
- [ ] Documentation updated
- [ ] Deployed successfully

### Bug Fix Checklist
- [ ] Issue documented
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Tests pass
- [ ] No regressions
- [ ] Documentation updated
- [ ] Issue closed

### SEO Update Checklist
- [ ] Keywords researched
- [ ] Content optimized
- [ ] Meta tags updated
- [ ] Schema validated
- [ ] Internal links added
- [ ] Mobile friendly
- [ ] Performance good

## 🔄 Maintenance Procedures

### Weekly Maintenance

#### Monday
1. Review error logs
2. Check Google Search Console
3. Update dependencies if needed
4. Test all forms

#### Wednesday
1. Performance audit
2. SEO check
3. Security scan
4. Backup verification

#### Friday
1. Documentation review
2. Issue tracker cleanup
3. Plan next week
4. Update monitoring data

### Monthly Maintenance

#### First Week
1. Full SEO audit
2. Security assessment
3. Performance optimization
4. Accessibility check

#### Mid-Month
1. Dependency updates
2. Documentation update
3. Backup testing
4. Analytics review

#### End of Month
1. Monthly report
2. Metrics analysis
3. Goal setting
4. Process improvement

## 🎯 Best Practices

### Code Changes
1. Small, focused commits
2. Descriptive commit messages
3. Test before committing
4. Document significant changes

### Documentation
1. Update immediately
2. Be specific and detailed
3. Include examples
4. Cross-reference related docs

### Testing
1. Test locally first
2. Test incrementally
3. Test edge cases
4. Document test results

### Communication
1. Log all issues
2. Document decisions
3. Share lessons learned
4. Update team regularly

## 📚 Reference Commands

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter
npm run typecheck    # Check TypeScript
```

### Git
```bash
git status           # Check status
git add .            # Stage all changes
git commit -m "msg"  # Commit with message
git push             # Push to remote
git pull             # Pull from remote
git log --oneline    # View commit history
```

### Troubleshooting
```bash
npm install          # Reinstall dependencies
npm cache clean      # Clear npm cache
rm -rf node_modules  # Remove node_modules
npm install          # Fresh install
```

---

*Follow these procedures exactly. Update procedures when better methods are discovered.*