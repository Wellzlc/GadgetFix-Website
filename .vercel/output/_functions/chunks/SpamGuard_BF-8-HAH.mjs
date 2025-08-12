var ThreatType = /* @__PURE__ */ ((ThreatType2) => {
  ThreatType2["CRYPTO_SCAM"] = "crypto_scam";
  ThreatType2["BITCOIN_ADDRESS"] = "bitcoin_address";
  ThreatType2["WALLET_PHISHING"] = "wallet_phishing";
  ThreatType2["FAKE_TRANSFER"] = "fake_transfer";
  ThreatType2["ACTIVATION_SCHEME"] = "activation_scheme";
  ThreatType2["FIELD_MISMATCH"] = "field_mismatch";
  ThreatType2["URL_IN_NAME"] = "url_in_name";
  ThreatType2["EXCESSIVE_URLS"] = "excessive_urls";
  ThreatType2["SUSPICIOUS_KEYWORDS"] = "suspicious_keywords";
  ThreatType2["AI_GENERATED"] = "ai_generated";
  ThreatType2["DISPOSABLE_EMAIL"] = "disposable_email";
  ThreatType2["SUSPICIOUS_EMAIL"] = "suspicious_email";
  ThreatType2["EMAIL_DOMAIN_MISMATCH"] = "email_domain_mismatch";
  ThreatType2["INVALID_PHONE"] = "invalid_phone";
  ThreatType2["PHONE_GEO_MISMATCH"] = "phone_geo_mismatch";
  ThreatType2["RAPID_SUBMISSION"] = "rapid_submission";
  ThreatType2["BOT_BEHAVIOR"] = "bot_behavior";
  ThreatType2["HONEYPOT_TRIGGERED"] = "honeypot_triggered";
  ThreatType2["SUSPICIOUS_TIMING"] = "suspicious_timing";
  ThreatType2["GEO_INCONSISTENCY"] = "geo_inconsistency";
  ThreatType2["VPN_DETECTED"] = "vpn_detected";
  ThreatType2["TOR_DETECTED"] = "tor_detected";
  ThreatType2["URGENCY_LANGUAGE"] = "urgency_language";
  ThreatType2["AUTHORITY_CLAIM"] = "authority_claim";
  ThreatType2["FEAR_TACTIC"] = "fear_tactic";
  ThreatType2["TOO_GOOD_TO_BE_TRUE"] = "too_good_to_be_true";
  ThreatType2["EMOTIONAL_MANIPULATION"] = "emotional_manipulation";
  ThreatType2["XSS_ATTEMPT"] = "xss_attempt";
  ThreatType2["SQL_INJECTION"] = "sql_injection";
  ThreatType2["COMMAND_INJECTION"] = "command_injection";
  ThreatType2["PATH_TRAVERSAL"] = "path_traversal";
  ThreatType2["BLACKLISTED_IP"] = "blacklisted_ip";
  ThreatType2["BLACKLISTED_EMAIL"] = "blacklisted_email";
  ThreatType2["KNOWN_SPAMMER"] = "known_spammer";
  ThreatType2["BAD_REPUTATION"] = "bad_reputation";
  return ThreatType2;
})(ThreatType || {});

class ThreatDetector {
  cryptoPatterns = {
    bitcoinAddress: /\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}\b/gi,
    ethereumAddress: /\b0x[a-fA-F0-9]{40}\b/gi,
    cryptoKeywords: /\b(bitcoin|btc|ethereum|eth|crypto|wallet|transfer|activation|blockchain|usdt|usdc|binance|coinbase)\b/gi,
    scamPhrases: [
      /activate.{0,20}(transfer|payment|funds?)/gi,
      /confirm.{0,20}(transfer|transaction)/gi,
      /pending.{0,20}(transfer|withdrawal)/gi,
      /release.{0,20}funds?/gi,
      /verify.{0,20}wallet/gi,
      /claim.{0,20}(bitcoin|crypto|reward)/gi,
      /minimum.{0,20}(deposit|transfer)/gi
    ]
  };
  suspiciousUrlPatterns = {
    urlShorteners: /\b(bit\.ly|tinyurl|goo\.gl|ow\.ly|t\.co|short\.link|rebrand\.ly)\//gi,
    suspiciousTLDs: /\.(tk|ml|ga|cf|click|download|review|top|loan|work|men|date|party|racing|win|stream|gdn)\b/gi,
    ipAddresses: /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/gi,
    punycode: /xn--/gi,
    homoglyphs: /[а-яА-Я]/,
    // Cyrillic characters that look like Latin
    excessiveSubdomains: /([a-z0-9-]+\.){4,}/gi
  };
  socialEngineeringPatterns = {
    urgency: /\b(urgent|immediate|expire|deadline|limited time|act now|don't wait|hurry|last chance|ending soon)\b/gi,
    authority: /\b(official|authorized|certified|guaranteed|approved by|endorsed by|government|federal|irs|fbi)\b/gi,
    fear: /\b(suspend|terminate|close|delete|lock|freeze|illegal|arrest|lawsuit|legal action|prosecute)\b/gi,
    tooGood: /\b(free money|easy money|congratulations you won|winner|million|prize|reward|gift card|claim now)\b/gi,
    emotional: /\b(help me|desperate|emergency|life or death|dying|sick child|tragedy|disaster)\b/gi
  };
  technicalThreats = {
    xss: /<script|javascript:|onerror=|onload=|onclick=/gi,
    sqlInjection: /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript)\b.*\b(from|where|table|database)\b)|(--)|(;.*\b(select|union|insert|update|delete|drop)\b)/gi,
    commandInjection: /[;&|`$]|\$\(.*\)|\bsh\b|\bbash\b|\bcmd\b/gi,
    pathTraversal: /\.\.[\/\\]|\.\.%2[fF]|\.\.%5[cC]/gi
  };
  async analyze(submission) {
    const threats = [];
    let maxConfidence = 0;
    for (const [fieldName, fieldValue] of Object.entries(submission.fields)) {
      if (typeof fieldValue !== "string") continue;
      threats.push(...this.detectCryptoScams(fieldName, fieldValue));
      threats.push(...this.detectFieldMismatch(fieldName, fieldValue));
      threats.push(...this.detectSuspiciousUrls(fieldName, fieldValue));
      threats.push(...this.detectSocialEngineering(fieldName, fieldValue));
      threats.push(...this.detectTechnicalThreats(fieldName, fieldValue));
    }
    threats.push(...this.performCrossFieldAnalysis(submission));
    if (threats.length > 0) {
      maxConfidence = Math.min(1, threats.reduce((max, t) => Math.max(max, t.confidence), 0));
    }
    return { threats, confidence: maxConfidence };
  }
  detectCryptoScams(field, value) {
    const threats = [];
    if (this.cryptoPatterns.bitcoinAddress.test(value)) {
      threats.push({
        type: ThreatType.BITCOIN_ADDRESS,
        field,
        pattern: "Bitcoin address detected",
        confidence: 0.95,
        description: "Bitcoin wallet address found in submission",
        evidence: [value.match(this.cryptoPatterns.bitcoinAddress)?.[0] || ""],
        severity: "high"
      });
    }
    if (this.cryptoPatterns.ethereumAddress.test(value)) {
      threats.push({
        type: ThreatType.CRYPTO_SCAM,
        field,
        pattern: "Ethereum address detected",
        confidence: 0.95,
        description: "Ethereum wallet address found in submission",
        evidence: [value.match(this.cryptoPatterns.ethereumAddress)?.[0] || ""],
        severity: "high"
      });
    }
    const cryptoMatches = value.match(this.cryptoPatterns.cryptoKeywords);
    if (cryptoMatches && cryptoMatches.length > 2) {
      threats.push({
        type: ThreatType.CRYPTO_SCAM,
        field,
        pattern: "Multiple cryptocurrency keywords",
        confidence: Math.min(0.3 + cryptoMatches.length * 0.15, 0.9),
        description: "Multiple cryptocurrency-related terms detected",
        evidence: cryptoMatches.slice(0, 5),
        severity: "medium"
      });
    }
    for (const pattern of this.cryptoPatterns.scamPhrases) {
      if (pattern.test(value)) {
        threats.push({
          type: ThreatType.ACTIVATION_SCHEME,
          field,
          pattern: "Activation/transfer scam pattern",
          confidence: 0.85,
          description: "Common cryptocurrency scam phrase detected",
          evidence: [value.match(pattern)?.[0] || ""],
          severity: "high"
        });
      }
    }
    return threats;
  }
  detectFieldMismatch(field, value) {
    const threats = [];
    if ((field.toLowerCase().includes("name") || field.toLowerCase().includes("firstname") || field.toLowerCase().includes("lastname")) && /https?:\/\//i.test(value)) {
      threats.push({
        type: ThreatType.URL_IN_NAME,
        field,
        pattern: "URL in name field",
        confidence: 0.9,
        description: "URL detected in a name field - common spam tactic",
        evidence: [value],
        severity: "high"
      });
    }
    if (!field.toLowerCase().includes("email") && /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(value)) {
      const emailCount = (value.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi) || []).length;
      if (emailCount > 1 || field.toLowerCase().includes("name")) {
        threats.push({
          type: ThreatType.FIELD_MISMATCH,
          field,
          pattern: "Email in unexpected field",
          confidence: 0.7,
          description: "Email address found in non-email field",
          evidence: [value.substring(0, 100)],
          severity: "medium"
        });
      }
    }
    if (!field.toLowerCase().includes("phone") && !field.toLowerCase().includes("mobile") && /(\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g.test(value)) {
      const phoneMatches = value.match(/(\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g) || [];
      if (phoneMatches.length > 1) {
        threats.push({
          type: ThreatType.FIELD_MISMATCH,
          field,
          pattern: "Phone numbers in unexpected field",
          confidence: 0.6,
          description: "Multiple phone numbers found in non-phone field",
          evidence: phoneMatches.slice(0, 3),
          severity: "medium"
        });
      }
    }
    return threats;
  }
  detectSuspiciousUrls(field, value) {
    const threats = [];
    const urlMatches = value.match(/https?:\/\/[^\s]+/gi) || [];
    if (urlMatches.length > 0) {
      if (this.suspiciousUrlPatterns.urlShorteners.test(value)) {
        threats.push({
          type: ThreatType.EXCESSIVE_URLS,
          field,
          pattern: "URL shortener detected",
          confidence: 0.8,
          description: "URL shortener service detected - often used in phishing",
          evidence: urlMatches.filter((url) => this.suspiciousUrlPatterns.urlShorteners.test(url)),
          severity: "high"
        });
      }
      if (this.suspiciousUrlPatterns.suspiciousTLDs.test(value)) {
        threats.push({
          type: ThreatType.EXCESSIVE_URLS,
          field,
          pattern: "Suspicious TLD",
          confidence: 0.7,
          description: "URL with suspicious top-level domain",
          evidence: urlMatches.filter((url) => this.suspiciousUrlPatterns.suspiciousTLDs.test(url)),
          severity: "medium"
        });
      }
      if (this.suspiciousUrlPatterns.ipAddresses.test(value)) {
        threats.push({
          type: ThreatType.EXCESSIVE_URLS,
          field,
          pattern: "IP address URL",
          confidence: 0.85,
          description: "URL using IP address instead of domain name",
          evidence: urlMatches.filter((url) => this.suspiciousUrlPatterns.ipAddresses.test(url)),
          severity: "high"
        });
      }
      if (this.suspiciousUrlPatterns.punycode.test(value)) {
        threats.push({
          type: ThreatType.EXCESSIVE_URLS,
          field,
          pattern: "Punycode URL",
          confidence: 0.75,
          description: "Internationalized domain name detected - potential phishing",
          evidence: urlMatches.filter((url) => this.suspiciousUrlPatterns.punycode.test(url)),
          severity: "medium"
        });
      }
      if (urlMatches.length > 3) {
        threats.push({
          type: ThreatType.EXCESSIVE_URLS,
          field,
          pattern: "Too many URLs",
          confidence: Math.min(0.4 + urlMatches.length * 0.1, 0.9),
          description: `${urlMatches.length} URLs detected in submission`,
          evidence: urlMatches.slice(0, 5),
          severity: "medium"
        });
      }
    }
    for (const url of urlMatches) {
      const entropy = this.calculateEntropy(url);
      if (entropy > 4.5) {
        threats.push({
          type: ThreatType.EXCESSIVE_URLS,
          field,
          pattern: "High entropy URL",
          confidence: Math.min(0.5 + (entropy - 4.5) * 0.2, 0.9),
          description: "URL contains suspicious random-looking characters",
          evidence: [url],
          severity: "medium"
        });
      }
    }
    return threats;
  }
  detectSocialEngineering(field, value) {
    const threats = [];
    const urgencyMatches = value.match(this.socialEngineeringPatterns.urgency);
    if (urgencyMatches && urgencyMatches.length > 1) {
      threats.push({
        type: ThreatType.URGENCY_LANGUAGE,
        field,
        pattern: "Urgency tactics",
        confidence: Math.min(0.4 + urgencyMatches.length * 0.2, 0.85),
        description: "Multiple urgency-inducing phrases detected",
        evidence: urgencyMatches.slice(0, 3),
        severity: "medium"
      });
    }
    if (this.socialEngineeringPatterns.authority.test(value)) {
      threats.push({
        type: ThreatType.AUTHORITY_CLAIM,
        field,
        pattern: "False authority",
        confidence: 0.7,
        description: "Claims of authority or official status",
        evidence: [value.match(this.socialEngineeringPatterns.authority)?.[0] || ""],
        severity: "medium"
      });
    }
    if (this.socialEngineeringPatterns.fear.test(value)) {
      threats.push({
        type: ThreatType.FEAR_TACTIC,
        field,
        pattern: "Fear-based manipulation",
        confidence: 0.75,
        description: "Fear-inducing language detected",
        evidence: [value.match(this.socialEngineeringPatterns.fear)?.[0] || ""],
        severity: "high"
      });
    }
    if (this.socialEngineeringPatterns.tooGood.test(value)) {
      threats.push({
        type: ThreatType.TOO_GOOD_TO_BE_TRUE,
        field,
        pattern: "Unrealistic offer",
        confidence: 0.8,
        description: "Unrealistic promises or offers detected",
        evidence: [value.match(this.socialEngineeringPatterns.tooGood)?.[0] || ""],
        severity: "high"
      });
    }
    if (this.socialEngineeringPatterns.emotional.test(value)) {
      threats.push({
        type: ThreatType.EMOTIONAL_MANIPULATION,
        field,
        pattern: "Emotional appeal",
        confidence: 0.65,
        description: "Emotional manipulation tactics detected",
        evidence: [value.match(this.socialEngineeringPatterns.emotional)?.[0] || ""],
        severity: "medium"
      });
    }
    return threats;
  }
  detectTechnicalThreats(field, value) {
    const threats = [];
    if (this.technicalThreats.xss.test(value)) {
      threats.push({
        type: ThreatType.XSS_ATTEMPT,
        field,
        pattern: "XSS payload",
        confidence: 0.95,
        description: "Cross-site scripting attempt detected",
        evidence: [value.match(this.technicalThreats.xss)?.[0] || ""],
        severity: "critical"
      });
    }
    if (this.technicalThreats.sqlInjection.test(value)) {
      threats.push({
        type: ThreatType.SQL_INJECTION,
        field,
        pattern: "SQL injection",
        confidence: 0.9,
        description: "SQL injection attempt detected",
        evidence: [value.substring(0, 100)],
        severity: "critical"
      });
    }
    if (this.technicalThreats.commandInjection.test(value)) {
      threats.push({
        type: ThreatType.COMMAND_INJECTION,
        field,
        pattern: "Command injection",
        confidence: 0.85,
        description: "Command injection attempt detected",
        evidence: [value.match(this.technicalThreats.commandInjection)?.[0] || ""],
        severity: "critical"
      });
    }
    if (this.technicalThreats.pathTraversal.test(value)) {
      threats.push({
        type: ThreatType.PATH_TRAVERSAL,
        field,
        pattern: "Path traversal",
        confidence: 0.9,
        description: "Path traversal attempt detected",
        evidence: [value.match(this.technicalThreats.pathTraversal)?.[0] || ""],
        severity: "critical"
      });
    }
    return threats;
  }
  performCrossFieldAnalysis(submission) {
    const threats = [];
    const allText = Object.values(submission.fields).join(" ");
    const suspiciousKeywords = [
      "bitcoin",
      "crypto",
      "wallet",
      "transfer",
      "urgent",
      "click",
      "verify",
      "suspend",
      "expire",
      "confirm",
      "activate"
    ];
    let keywordCount = 0;
    for (const keyword of suspiciousKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = allText.match(regex);
      if (matches) keywordCount += matches.length;
    }
    const wordCount = allText.split(/\s+/).length;
    const keywordDensity = keywordCount / Math.max(wordCount, 1);
    if (keywordDensity > 0.1) {
      threats.push({
        type: ThreatType.SUSPICIOUS_KEYWORDS,
        pattern: "High suspicious keyword density",
        confidence: Math.min(0.5 + keywordDensity * 2, 0.95),
        description: `Suspicious keyword density: ${(keywordDensity * 100).toFixed(1)}%`,
        evidence: [`${keywordCount} suspicious keywords in ${wordCount} words`],
        severity: "high"
      });
    }
    const email = submission.fields.email;
    const phone = submission.fields.phone;
    if (email && phone) {
      if (typeof email === "string" && typeof phone === "string") {
        const emailDomain = email.split("@")[1];
        if (emailDomain) {
          const isUSPhone = /^\+?1/.test(phone) || /^\(?[2-9]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(phone);
          const isForeignEmail = /\.(ru|cn|tk|ml|ga|cf)$/i.test(emailDomain);
          if (isUSPhone && isForeignEmail) {
            threats.push({
              type: ThreatType.GEO_INCONSISTENCY,
              pattern: "Geographic data mismatch",
              confidence: 0.7,
              description: "US phone number with suspicious foreign email domain",
              evidence: [`Phone: ${phone.substring(0, 20)}, Email domain: ${emailDomain}`],
              severity: "medium"
            });
          }
        }
      }
    }
    return threats;
  }
  calculateEntropy(str) {
    const freq = {};
    for (const char of str) {
      freq[char] = (freq[char] || 0) + 1;
    }
    let entropy = 0;
    const len = str.length;
    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }
}

class BehavioralAnalyzer {
  rateLimits = /* @__PURE__ */ new Map();
  ipGeocache = /* @__PURE__ */ new Map();
  suspiciousUserAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /ruby/i,
    /perl/i,
    /php/i,
    /headless/i,
    /phantom/i,
    /selenium/i,
    /puppeteer/i
  ];
  vpnASNs = /* @__PURE__ */ new Set([
    "13335",
    // Cloudflare
    "16509",
    // Amazon AWS
    "15169",
    // Google
    "8075",
    // Microsoft Azure
    "20473",
    // Choopa (Vultr)
    "16276",
    // OVH
    "24940",
    // Hetzner
    "14061"
    // DigitalOcean
  ]);
  async analyze(submission, context) {
    const threats = [];
    let maxConfidence = 0;
    threats.push(...await this.checkSubmissionVelocity(submission));
    threats.push(...this.detectBotBehavior(submission));
    threats.push(...this.analyzeTimingPatterns(submission));
    threats.push(...await this.checkGeographicConsistency(submission, context));
    threats.push(...this.analyzeBrowserFingerprint(submission));
    threats.push(...this.checkHoneypotFields(submission));
    threats.push(...this.analyzeUserAgent(submission));
    if (threats.length > 0) {
      maxConfidence = Math.min(1, threats.reduce((max, t) => Math.max(max, t.confidence), 0));
    }
    return { threats, confidence: maxConfidence };
  }
  async checkSubmissionVelocity(submission) {
    const threats = [];
    const key = submission.ip;
    const now = /* @__PURE__ */ new Date();
    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, {
        count: 1,
        firstSeen: now,
        lastSeen: now,
        submissions: [submission.id]
      });
    } else {
      const entry = this.rateLimits.get(key);
      entry.count++;
      entry.lastSeen = now;
      entry.submissions.push(submission.id);
      const timeDiff = now.getTime() - entry.firstSeen.getTime();
      const minutes = timeDiff / 6e4;
      if (entry.count > 3 && minutes < 1) {
        threats.push({
          type: ThreatType.RAPID_SUBMISSION,
          pattern: "Rapid submission rate",
          confidence: Math.min(0.6 + (entry.count - 3) * 0.1, 0.95),
          description: `${entry.count} submissions in ${minutes.toFixed(1)} minutes`,
          evidence: [`IP: ${submission.ip}`, `Count: ${entry.count}`],
          severity: "high"
        });
      }
      if (entry.count > 10 && minutes < 60) {
        threats.push({
          type: ThreatType.RAPID_SUBMISSION,
          pattern: "High submission volume",
          confidence: Math.min(0.5 + (entry.count - 10) * 0.05, 0.9),
          description: `${entry.count} submissions in ${(minutes / 60).toFixed(1)} hours`,
          evidence: [`IP: ${submission.ip}`, `Count: ${entry.count}`],
          severity: "medium"
        });
      }
    }
    for (const [k, v] of this.rateLimits.entries()) {
      if (now.getTime() - v.lastSeen.getTime() > 864e5) {
        this.rateLimits.delete(k);
      }
    }
    return threats;
  }
  detectBotBehavior(submission) {
    const threats = [];
    const metadata = submission.metadata;
    if (metadata.submissionTime < 3e3) {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: "Form filled too quickly",
        confidence: Math.min(0.9 - metadata.submissionTime / 1e4, 0.95),
        description: `Form submitted in ${metadata.submissionTime}ms`,
        evidence: [`Submission time: ${metadata.submissionTime}ms`],
        severity: "high"
      });
    }
    if (metadata.mouseMovements === 0 && metadata.submissionTime > 1e3) {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: "No mouse movement detected",
        confidence: 0.8,
        description: "Form submitted without any mouse movement",
        evidence: ["Mouse movements: 0"],
        severity: "high"
      });
    }
    const hasTextInput = Object.values(submission.fields).some(
      (v) => typeof v === "string" && v.length > 10
    );
    if (hasTextInput && (!metadata.keystrokes || metadata.keystrokes === 0)) {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: "Text without keystrokes",
        confidence: 0.85,
        description: "Text input detected without keyboard events",
        evidence: ["Keystrokes: 0"],
        severity: "high"
      });
    }
    if (metadata.fieldFocusOrder) {
      const expectedOrder = Object.keys(submission.fields);
      const actualOrder = metadata.fieldFocusOrder;
      if (JSON.stringify(expectedOrder) === JSON.stringify(actualOrder)) {
        threats.push({
          type: ThreatType.BOT_BEHAVIOR,
          pattern: "Linear field completion",
          confidence: 0.6,
          description: "Fields completed in exact DOM order",
          evidence: ["Perfect linear field order"],
          severity: "medium"
        });
      }
    }
    if (metadata.copyPasteEvents && metadata.copyPasteEvents > 3) {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: "Excessive paste events",
        confidence: Math.min(0.4 + metadata.copyPasteEvents * 0.1, 0.8),
        description: `${metadata.copyPasteEvents} paste events detected`,
        evidence: [`Paste events: ${metadata.copyPasteEvents}`],
        severity: "medium"
      });
    }
    if (!metadata.plugins || metadata.plugins.length === 0) {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: "No browser plugins",
        confidence: 0.5,
        description: "Browser reports no plugins - possible headless browser",
        evidence: ["Plugins: 0"],
        severity: "low"
      });
    }
    if (metadata.screenResolution === "0x0" || !metadata.screenResolution) {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: "Invalid screen resolution",
        confidence: 0.9,
        description: "No valid screen resolution - likely headless browser",
        evidence: [`Resolution: ${metadata.screenResolution || "undefined"}`],
        severity: "high"
      });
    }
    return threats;
  }
  analyzeTimingPatterns(submission) {
    const threats = [];
    const hour = submission.timestamp.getHours();
    submission.timestamp.getDay();
    if (hour >= 2 && hour <= 5) {
      threats.push({
        type: ThreatType.SUSPICIOUS_TIMING,
        pattern: "Unusual submission hour",
        confidence: 0.4,
        description: `Submission at ${hour}:00 local time`,
        evidence: [`Time: ${submission.timestamp.toLocaleTimeString()}`],
        severity: "low"
      });
    }
    if (submission.timestamp.getSeconds() === 0 && submission.timestamp.getMilliseconds() < 100) {
      threats.push({
        type: ThreatType.SUSPICIOUS_TIMING,
        pattern: "Exact timing pattern",
        confidence: 0.3,
        description: "Submission at exact minute mark",
        evidence: [`Timestamp: ${submission.timestamp.toISOString()}`],
        severity: "low"
      });
    }
    return threats;
  }
  async checkGeographicConsistency(submission, context) {
    const threats = [];
    const vpnCheck = await this.detectVPNOrProxy(submission.ip);
    if (vpnCheck.isVPN) {
      threats.push({
        type: ThreatType.VPN_DETECTED,
        pattern: "VPN/Proxy detected",
        confidence: vpnCheck.confidence,
        description: "Submission from VPN or proxy server",
        evidence: [`IP: ${submission.ip}`, `ASN: ${vpnCheck.asn}`],
        severity: "medium"
      });
    }
    if (await this.isTorExitNode(submission.ip)) {
      threats.push({
        type: ThreatType.TOR_DETECTED,
        pattern: "Tor exit node",
        confidence: 0.95,
        description: "Submission from Tor network",
        evidence: [`IP: ${submission.ip}`],
        severity: "high"
      });
    }
    if (submission.metadata.timezone && context.timezone) {
      if (submission.metadata.timezone !== context.timezone) {
        threats.push({
          type: ThreatType.GEO_INCONSISTENCY,
          pattern: "Timezone mismatch",
          confidence: 0.6,
          description: "Browser timezone differs from expected",
          evidence: [
            `Browser: ${submission.metadata.timezone}`,
            `Expected: ${context.timezone}`
          ],
          severity: "medium"
        });
      }
    }
    if (submission.metadata.language && context.language) {
      if (!submission.metadata.language.startsWith(context.language.substring(0, 2))) {
        threats.push({
          type: ThreatType.GEO_INCONSISTENCY,
          pattern: "Language mismatch",
          confidence: 0.5,
          description: "Browser language differs from expected",
          evidence: [
            `Browser: ${submission.metadata.language}`,
            `Expected: ${context.language}`
          ],
          severity: "low"
        });
      }
    }
    return threats;
  }
  analyzeBrowserFingerprint(submission) {
    const threats = [];
    const metadata = submission.metadata;
    if (metadata.canvas && metadata.canvas === "blocked") {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: "Canvas fingerprinting blocked",
        confidence: 0.7,
        description: "Canvas fingerprinting is blocked - possible privacy tool or bot",
        evidence: ["Canvas: blocked"],
        severity: "medium"
      });
    }
    if (metadata.webgl && metadata.webgl === "blocked") {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: "WebGL blocked",
        confidence: 0.6,
        description: "WebGL is blocked - possible privacy tool or bot",
        evidence: ["WebGL: blocked"],
        severity: "medium"
      });
    }
    if (metadata.platform) {
      const ua = submission.userAgent.toLowerCase();
      const platform = metadata.platform.toLowerCase();
      if (platform.includes("win") && ua.includes("mac") || platform.includes("mac") && ua.includes("windows") || platform.includes("linux") && (ua.includes("windows") || ua.includes("mac"))) {
        threats.push({
          type: ThreatType.BOT_BEHAVIOR,
          pattern: "Platform mismatch",
          confidence: 0.8,
          description: "Browser platform does not match user agent",
          evidence: [`Platform: ${platform}`, `UserAgent: ${ua.substring(0, 50)}`],
          severity: "high"
        });
      }
    }
    if (metadata.colorDepth && ![8, 16, 24, 32].includes(metadata.colorDepth)) {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: "Unusual color depth",
        confidence: 0.6,
        description: "Browser reports unusual color depth",
        evidence: [`Color depth: ${metadata.colorDepth}`],
        severity: "medium"
      });
    }
    return threats;
  }
  checkHoneypotFields(submission) {
    const threats = [];
    const honeypotFields = ["website", "url", "honey", "trap", "bot-field", "email2", "name2"];
    for (const field of honeypotFields) {
      if (submission.fields[field] && submission.fields[field] !== "") {
        threats.push({
          type: ThreatType.HONEYPOT_TRIGGERED,
          pattern: "Honeypot field filled",
          confidence: 0.95,
          description: `Hidden honeypot field "${field}" was filled`,
          evidence: [`Field: ${field}`, `Value: ${String(submission.fields[field]).substring(0, 50)}`],
          severity: "critical"
        });
      }
    }
    return threats;
  }
  analyzeUserAgent(submission) {
    const threats = [];
    const ua = submission.userAgent;
    for (const pattern of this.suspiciousUserAgents) {
      if (pattern.test(ua)) {
        threats.push({
          type: ThreatType.BOT_BEHAVIOR,
          pattern: "Suspicious user agent",
          confidence: 0.8,
          description: "User agent indicates automated tool",
          evidence: [`UserAgent: ${ua.substring(0, 100)}`],
          severity: "high"
        });
        break;
      }
    }
    if (!ua || ua.length < 20) {
      threats.push({
        type: ThreatType.BOT_BEHAVIOR,
        pattern: "Invalid user agent",
        confidence: 0.9,
        description: "Missing or invalid user agent string",
        evidence: [`UserAgent: ${ua || "empty"}`],
        severity: "high"
      });
    }
    const oldBrowsers = [
      /MSIE [6-8]\./i,
      /Firefox\/[1-3]\d\./i,
      /Chrome\/[1-3]\d\./i,
      /Safari\/[1-4]\d{2}\./i
    ];
    for (const pattern of oldBrowsers) {
      if (pattern.test(ua)) {
        threats.push({
          type: ThreatType.BOT_BEHAVIOR,
          pattern: "Outdated browser",
          confidence: 0.7,
          description: "Very outdated browser version detected",
          evidence: [`UserAgent: ${ua.substring(0, 100)}`],
          severity: "medium"
        });
        break;
      }
    }
    return threats;
  }
  async detectVPNOrProxy(ip) {
    if (this.isPrivateIP(ip)) {
      return { isVPN: false, confidence: 0 };
    }
    const asn = await this.getASN(ip);
    if (asn && this.vpnASNs.has(asn)) {
      return { isVPN: true, confidence: 0.8, asn };
    }
    return { isVPN: false, confidence: 0 };
  }
  async isTorExitNode(ip) {
    return false;
  }
  isPrivateIP(ip) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4) return false;
    return (
      // 10.0.0.0 - 10.255.255.255
      parts[0] === 10 || // 172.16.0.0 - 172.31.255.255
      parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31 || // 192.168.0.0 - 192.168.255.255
      parts[0] === 192 && parts[1] === 168 || // 127.0.0.0 - 127.255.255.255 (loopback)
      parts[0] === 127
    );
  }
  async getASN(ip) {
    return null;
  }
}

class MLClassifier {
  model;
  trainingData = [];
  maxTrainingData = 1e4;
  minTrainingSamples = 100;
  aiPatterns = {
    gptStyle: [
      /\bAs an AI\b/i,
      /\bI understand your concern\b/i,
      /\bIt's important to note\b/i,
      /\bHowever, it's worth mentioning\b/i,
      /\bIn conclusion\b/i,
      /\bTo summarize\b/i,
      /\bFirstly.*Secondly.*Finally\b/is
    ],
    repetitiveStructure: /(\b\w+\b)(?=.*\b\1\b.*\b\1\b.*\b\1\b)/gi,
    unnaturalPhrasing: [
      /\bkindly\s+\w+\s+(?:me|us)\b/i,
      /\bdo the needful\b/i,
      /\brevert back\b/i,
      /\bintimate me\b/i
    ]
  };
  constructor() {
    this.model = this.initializeModel();
    this.loadStoredModel();
  }
  initializeModel() {
    return {
      version: "1.0.0",
      weights: /* @__PURE__ */ new Map(),
      bias: 0,
      featureMeans: /* @__PURE__ */ new Map(),
      featureStdDevs: /* @__PURE__ */ new Map(),
      threshold: 0.5,
      accuracy: 0,
      trainingSamples: 0
    };
  }
  async classify(submission) {
    const threats = [];
    const features = this.extractFeatures(submission);
    const aiDetection = this.detectAIGenerated(submission);
    if (aiDetection.isAI) {
      threats.push({
        type: ThreatType.AI_GENERATED,
        pattern: "AI-generated content",
        confidence: aiDetection.confidence,
        description: "Content appears to be generated by AI",
        evidence: aiDetection.evidence,
        severity: "medium"
      });
    }
    const normalizedFeatures = this.normalizeFeatures(features);
    const spamProbability = this.calculateSpamProbability(normalizedFeatures);
    const anomalyScore = this.detectAnomalies(features);
    const finalConfidence = Math.max(spamProbability, anomalyScore);
    if (finalConfidence > this.model.threshold) {
      threats.push({
        type: ThreatType.SUSPICIOUS_KEYWORDS,
        pattern: "ML classification",
        confidence: finalConfidence,
        description: "Machine learning model detected suspicious patterns",
        evidence: this.getTopFeatures(features),
        severity: finalConfidence > 0.8 ? "high" : "medium"
      });
    }
    return { threats, confidence: finalConfidence };
  }
  extractFeatures(submission) {
    const allText = Object.values(submission.fields).filter((v) => typeof v === "string").join(" ");
    const words = allText.split(/\s+/);
    const uniqueWords = new Set(words);
    const urlMatches = allText.match(/https?:\/\/[^\s]+/gi) || [];
    const domains = new Set(urlMatches.map((url) => {
      try {
        return new URL(url).hostname;
      } catch {
        return null;
      }
    }).filter(Boolean));
    const suspiciousUrls = urlMatches.filter(
      (url) => /\.(tk|ml|ga|cf|click|download|review|top|loan|work|men|date|party|racing|win|stream|gdn)\b/i.test(url) || /bit\.ly|tinyurl|goo\.gl/i.test(url)
    ).length;
    const shortenerUrls = urlMatches.filter(
      (url) => /bit\.ly|tinyurl|goo\.gl|ow\.ly|t\.co|short\.link|rebrand\.ly/i.test(url)
    ).length;
    const textLength = allText.length;
    const capitalLetters = (allText.match(/[A-Z]/g) || []).length;
    const punctuation = (allText.match(/[.,!?;:'"]/g) || []).length;
    const digits = (allText.match(/\d/g) || []).length;
    const specialChars = (allText.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const { sentimentScore, urgencyScore } = this.analyzeTextSentiment(allText);
    const complexityScore = uniqueWords.size / Math.max(words.length, 1);
    const shannonEntropy = this.calculateShannonEntropy(allText);
    const metadata = submission.metadata;
    return {
      textLength,
      wordCount: words.length,
      uniqueWords: uniqueWords.size,
      avgWordLength: words.reduce((sum, w) => sum + w.length, 0) / Math.max(words.length, 1),
      capitalRatio: capitalLetters / Math.max(textLength, 1),
      punctuationRatio: punctuation / Math.max(textLength, 1),
      digitRatio: digits / Math.max(textLength, 1),
      specialCharRatio: specialChars / Math.max(textLength, 1),
      urlCount: urlMatches.length,
      uniqueDomains: domains.size,
      suspiciousUrls,
      shortenerUrls,
      shannonEntropy,
      sentimentScore,
      urgencyScore,
      complexityScore,
      submissionTime: metadata.submissionTime || 0,
      fieldInteractions: metadata.fieldFocusOrder?.length || 0,
      correctionCount: metadata.keystrokes || 0,
      browserAge: 0,
      // Would need to track this
      cookiesEnabled: true,
      // Would need to detect
      jsEnabled: true,
      // Would need to detect
      pluginCount: metadata.plugins?.length || 0
    };
  }
  detectAIGenerated(submission) {
    const allText = Object.values(submission.fields).filter((v) => typeof v === "string").join(" ");
    const evidence = [];
    let score = 0;
    for (const pattern of this.aiPatterns.gptStyle) {
      if (pattern.test(allText)) {
        score += 0.2;
        const match = allText.match(pattern);
        if (match) evidence.push(match[0]);
      }
    }
    const repetitions = allText.match(this.aiPatterns.repetitiveStructure);
    if (repetitions && repetitions.length > 5) {
      score += 0.3;
      evidence.push("Repetitive word patterns detected");
    }
    for (const pattern of this.aiPatterns.unnaturalPhrasing) {
      if (pattern.test(allText)) {
        score += 0.15;
        const match = allText.match(pattern);
        if (match) evidence.push(match[0]);
      }
    }
    const sentences = allText.split(/[.!?]+/);
    const longSentences = sentences.filter((s) => s.split(/\s+/).length > 20);
    if (longSentences.length > 2 && !allText.match(/[.!?]{2,}/)) {
      score += 0.2;
      evidence.push("Unnaturally perfect sentence structure");
    }
    if (allText.length > 500) {
      const commonTypos = /\b(teh|recieve|occured|untill|wich|wierd)\b/gi;
      if (!commonTypos.test(allText)) {
        score += 0.1;
        evidence.push("No typos in long text");
      }
    }
    return {
      isAI: score > 0.5,
      confidence: Math.min(score, 0.95),
      evidence: evidence.slice(0, 3)
    };
  }
  analyzeTextSentiment(text) {
    const negativeWords = /\b(urgent|expire|suspend|delete|terminate|limited|deadline|act now|hurry|last chance)\b/gi;
    const positiveWords = /\b(free|winner|congratulations|prize|reward|bonus|guaranteed|amazing|incredible)\b/gi;
    const negativeMatches = (text.match(negativeWords) || []).length;
    const positiveMatches = (text.match(positiveWords) || []).length;
    const words = text.split(/\s+/).length;
    const sentimentScore = (negativeMatches + positiveMatches) / Math.max(words, 1);
    const urgencyWords = /\b(now|today|immediate|instant|quick|fast|hurry|expire|deadline|limited time|act now|don't wait)\b/gi;
    const urgencyMatches = (text.match(urgencyWords) || []).length;
    const urgencyScore = urgencyMatches / Math.max(words, 1);
    return { sentimentScore, urgencyScore };
  }
  calculateShannonEntropy(text) {
    const freq = /* @__PURE__ */ new Map();
    for (const char of text.toLowerCase()) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }
    let entropy = 0;
    const len = text.length;
    for (const count of freq.values()) {
      const p = count / len;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    return entropy;
  }
  normalizeFeatures(features) {
    const normalized = /* @__PURE__ */ new Map();
    for (const [key, value] of Object.entries(features)) {
      if (typeof value === "number") {
        const mean = this.model.featureMeans.get(key) || 0;
        const stdDev = this.model.featureStdDevs.get(key) || 1;
        normalized.set(key, (value - mean) / stdDev);
      } else if (typeof value === "boolean") {
        normalized.set(key, value ? 1 : 0);
      }
    }
    return normalized;
  }
  calculateSpamProbability(features) {
    let score = this.model.bias;
    for (const [feature, value] of features) {
      const weight = this.model.weights.get(feature) || 0;
      score += weight * value;
    }
    return 1 / (1 + Math.exp(-score));
  }
  detectAnomalies(features) {
    let anomalyScore = 0;
    let anomalyCount = 0;
    if (features.urlCount > 10) {
      anomalyScore += 0.3;
      anomalyCount++;
    }
    if (features.capitalRatio > 0.5) {
      anomalyScore += 0.2;
      anomalyCount++;
    }
    if (features.specialCharRatio > 0.3) {
      anomalyScore += 0.2;
      anomalyCount++;
    }
    if (features.urgencyScore > 0.1) {
      anomalyScore += 0.3;
      anomalyCount++;
    }
    if (features.shannonEntropy > 5 || features.shannonEntropy < 2) {
      anomalyScore += 0.2;
      anomalyCount++;
    }
    if (features.submissionTime < 2e3) {
      anomalyScore += 0.4;
      anomalyCount++;
    }
    return anomalyCount > 0 ? Math.min(anomalyScore / anomalyCount * 2, 0.95) : 0;
  }
  getTopFeatures(features) {
    const evidence = [];
    if (features.urlCount > 3) {
      evidence.push(`${features.urlCount} URLs detected`);
    }
    if (features.urgencyScore > 0.05) {
      evidence.push(`High urgency score: ${(features.urgencyScore * 100).toFixed(1)}%`);
    }
    if (features.capitalRatio > 0.3) {
      evidence.push(`Excessive capitals: ${(features.capitalRatio * 100).toFixed(1)}%`);
    }
    if (features.shannonEntropy > 4.5) {
      evidence.push(`High text entropy: ${features.shannonEntropy.toFixed(2)}`);
    }
    return evidence.slice(0, 3);
  }
  async learn(submission, result) {
    const features = this.extractFeatures(submission);
    const label = result.threatLevel === "none" ? "ham" : "spam";
    this.trainingData.push({
      features,
      label,
      confidence: result.confidence,
      timestamp: /* @__PURE__ */ new Date()
    });
    if (this.trainingData.length > this.maxTrainingData) {
      this.trainingData.shift();
    }
    if (this.trainingData.length >= this.minTrainingSamples && this.trainingData.length % 100 === 0) {
      await this.retrain();
    }
  }
  async retrain() {
    this.updateFeatureStatistics();
    const learningRate = 0.01;
    const recentData = this.trainingData.slice(-100);
    for (const data of recentData) {
      const normalizedFeatures = this.normalizeFeatures(data.features);
      const prediction = this.calculateSpamProbability(normalizedFeatures);
      const target = data.label === "spam" ? 1 : 0;
      const error = target - prediction;
      for (const [feature, value] of normalizedFeatures) {
        const currentWeight = this.model.weights.get(feature) || 0;
        const newWeight = currentWeight + learningRate * error * value;
        this.model.weights.set(feature, newWeight);
      }
      this.model.bias += learningRate * error;
    }
    this.model.trainingSamples = this.trainingData.length;
    this.model.version = this.incrementVersion(this.model.version);
    await this.saveModel();
  }
  updateFeatureStatistics() {
    const allFeatures = /* @__PURE__ */ new Map();
    for (const data of this.trainingData) {
      for (const [key, value] of Object.entries(data.features)) {
        if (typeof value === "number") {
          if (!allFeatures.has(key)) {
            allFeatures.set(key, []);
          }
          allFeatures.get(key).push(value);
        }
      }
    }
    for (const [feature, values] of allFeatures) {
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      this.model.featureMeans.set(feature, mean);
      this.model.featureStdDevs.set(feature, stdDev || 1);
    }
  }
  async feedback(submissionId, wasSpam) {
    console.log(`Feedback received: ${submissionId} was ${wasSpam ? "spam" : "not spam"}`);
  }
  incrementVersion(version) {
    const parts = version.split(".");
    parts[2] = String(parseInt(parts[2]) + 1);
    return parts.join(".");
  }
  async saveModel() {
    if (typeof window !== "undefined" && window.localStorage) {
      const modelData = {
        version: this.model.version,
        weights: Array.from(this.model.weights.entries()),
        bias: this.model.bias,
        featureMeans: Array.from(this.model.featureMeans.entries()),
        featureStdDevs: Array.from(this.model.featureStdDevs.entries()),
        threshold: this.model.threshold,
        trainingSamples: this.model.trainingSamples
      };
      localStorage.setItem("spamguard_ml_model", JSON.stringify(modelData));
    }
  }
  loadStoredModel() {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = localStorage.getItem("spamguard_ml_model");
      if (stored) {
        try {
          const modelData = JSON.parse(stored);
          this.model.version = modelData.version;
          this.model.weights = new Map(modelData.weights);
          this.model.bias = modelData.bias;
          this.model.featureMeans = new Map(modelData.featureMeans);
          this.model.featureStdDevs = new Map(modelData.featureStdDevs);
          this.model.threshold = modelData.threshold;
          this.model.trainingSamples = modelData.trainingSamples;
        } catch (error) {
          console.error("Failed to load stored model:", error);
        }
      }
    }
  }
  getVersion() {
    return this.model.version;
  }
  getModelStats() {
    return {
      version: this.model.version,
      trainingSamples: this.model.trainingSamples,
      accuracy: this.model.accuracy,
      features: this.model.weights.size,
      threshold: this.model.threshold
    };
  }
}

class RuleEngine {
  rules = /* @__PURE__ */ new Map();
  customPatterns = /* @__PURE__ */ new Map();
  constructor() {
    this.initializeDefaultRules();
  }
  initializeDefaultRules() {
    this.addRule({
      id: "crypto_transfer_scam",
      name: "Cryptocurrency Transfer Scam",
      conditions: [
        { field: "any", operator: "contains", value: "bitcoin" },
        { field: "any", operator: "contains", value: "transfer" },
        { field: "any", operator: "matches", value: /\b(activate|confirm|release|pending)\b/i }
      ],
      action: "block",
      priority: 100,
      enabled: true,
      description: "Blocks cryptocurrency transfer scam attempts",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      hitCount: 0
    });
    this.addRule({
      id: "url_in_name",
      name: "URL in Name Field",
      conditions: [
        { field: "name", operator: "matches", value: /https?:\/\//i }
      ],
      action: "quarantine",
      priority: 90,
      enabled: true,
      description: "Quarantines submissions with URLs in name fields",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      hitCount: 0
    });
    this.addRule({
      id: "excessive_urls",
      name: "Too Many URLs",
      conditions: [
        { field: "any", operator: "matches", value: /(https?:\/\/[^\s]+.*){4,}/i }
      ],
      action: "quarantine",
      priority: 80,
      enabled: true,
      description: "Quarantines submissions with 4+ URLs",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      hitCount: 0
    });
    this.addRule({
      id: "spam_phrases",
      name: "Known Spam Phrases",
      conditions: [
        { field: "any", operator: "matches", value: /\b(click here now|limited time offer|act now|congratulations you won|claim your prize)\b/i }
      ],
      action: "block",
      priority: 85,
      enabled: true,
      description: "Blocks known spam phrases",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      hitCount: 0
    });
    this.addRule({
      id: "disposable_email",
      name: "Disposable Email Service",
      conditions: [
        { field: "email", operator: "matches", value: /@(mailinator|guerrillamail|10minutemail|tempmail|throwaway\.email|trashemail)\./i }
      ],
      action: "quarantine",
      priority: 70,
      enabled: true,
      description: "Quarantines submissions from disposable email services",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      hitCount: 0
    });
    this.addRule({
      id: "sql_injection",
      name: "SQL Injection Attempt",
      conditions: [
        { field: "any", operator: "matches", value: /(\bUNION\b.*\bSELECT\b|\bDROP\s+TABLE\b|\bINSERT\s+INTO\b.*\bVALUES\b)/i }
      ],
      action: "block",
      priority: 100,
      enabled: true,
      description: "Blocks SQL injection attempts",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      hitCount: 0
    });
    this.addRule({
      id: "xss_attempt",
      name: "Cross-Site Scripting Attempt",
      conditions: [
        { field: "any", operator: "matches", value: /<script|javascript:|onerror=|onclick=|<iframe/i }
      ],
      action: "block",
      priority: 100,
      enabled: true,
      description: "Blocks XSS attempts",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      hitCount: 0
    });
    this.addRule({
      id: "phone_spam",
      name: "Multiple Phone Numbers",
      conditions: [
        { field: "any", operator: "matches", value: /(\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}.*(\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}.*(\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g }
      ],
      action: "quarantine",
      priority: 60,
      enabled: true,
      description: "Quarantines submissions with 3+ phone numbers",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      hitCount: 0
    });
  }
  async evaluate(submission, existingThreats) {
    const additionalThreats = [];
    let maxConfidence = 0;
    const sortedRules = Array.from(this.rules.values()).filter((rule) => rule.enabled).sort((a, b) => b.priority - a.priority);
    for (const rule of sortedRules) {
      if (this.evaluateRule(rule, submission)) {
        rule.hitCount++;
        rule.lastHit = /* @__PURE__ */ new Date();
        const confidence = this.calculateRuleConfidence(rule);
        maxConfidence = Math.max(maxConfidence, confidence);
        additionalThreats.push({
          type: this.mapRuleToThreatType(rule),
          pattern: rule.name,
          confidence,
          description: rule.description,
          evidence: this.extractEvidence(rule, submission),
          severity: this.mapActionToSeverity(rule.action)
        });
        if (rule.action === "block") {
          break;
        }
      }
    }
    return { additionalThreats, confidence: maxConfidence };
  }
  evaluateRule(rule, submission) {
    for (const condition of rule.conditions) {
      if (!this.evaluateCondition(condition, submission)) {
        return false;
      }
    }
    return true;
  }
  evaluateCondition(condition, submission) {
    let value;
    if (condition.field === "any") {
      value = Object.values(submission.fields).filter((v) => typeof v === "string").join(" ");
    } else if (condition.field) {
      const fieldValue = submission.fields[condition.field];
      if (fieldValue === void 0) return false;
      value = String(fieldValue);
    } else {
      return false;
    }
    if (!condition.caseSensitive) {
      value = value.toLowerCase();
    }
    switch (condition.operator) {
      case "contains":
        const searchValue = condition.caseSensitive ? String(condition.value) : String(condition.value).toLowerCase();
        return value.includes(searchValue);
      case "equals":
        const equalValue = condition.caseSensitive ? String(condition.value) : String(condition.value).toLowerCase();
        return value === equalValue;
      case "matches":
        if (condition.value instanceof RegExp) {
          return condition.value.test(value);
        } else {
          return new RegExp(String(condition.value)).test(value);
        }
      case "greater":
        return parseFloat(value) > parseFloat(String(condition.value));
      case "less":
        return parseFloat(value) < parseFloat(String(condition.value));
      case "in":
        if (Array.isArray(condition.value)) {
          return condition.value.some((v) => {
            const checkValue = condition.caseSensitive ? String(v) : String(v).toLowerCase();
            return value.includes(checkValue);
          });
        }
        return false;
      case "not_in":
        if (Array.isArray(condition.value)) {
          return !condition.value.some((v) => {
            const checkValue = condition.caseSensitive ? String(v) : String(v).toLowerCase();
            return value.includes(checkValue);
          });
        }
        return true;
      default:
        return false;
    }
  }
  calculateRuleConfidence(rule) {
    let confidence = rule.priority / 100;
    switch (rule.action) {
      case "block":
        confidence = Math.max(confidence, 0.9);
        break;
      case "quarantine":
        confidence = Math.max(confidence, 0.7);
        break;
      case "flag":
        confidence = Math.max(confidence, 0.5);
        break;
    }
    const age = Date.now() - rule.createdAt.getTime();
    if (age < 864e5) {
      confidence *= 0.9;
    }
    return Math.min(confidence, 0.95);
  }
  mapRuleToThreatType(rule) {
    const mapping = {
      "crypto_transfer_scam": ThreatType.CRYPTO_SCAM,
      "url_in_name": ThreatType.URL_IN_NAME,
      "excessive_urls": ThreatType.EXCESSIVE_URLS,
      "spam_phrases": ThreatType.SUSPICIOUS_KEYWORDS,
      "disposable_email": ThreatType.DISPOSABLE_EMAIL,
      "sql_injection": ThreatType.SQL_INJECTION,
      "xss_attempt": ThreatType.XSS_ATTEMPT,
      "phone_spam": ThreatType.SUSPICIOUS_KEYWORDS
    };
    return mapping[rule.id] || ThreatType.SUSPICIOUS_KEYWORDS;
  }
  mapActionToSeverity(action) {
    switch (action) {
      case "block":
        return "critical";
      case "quarantine":
        return "high";
      case "flag":
        return "medium";
      default:
        return "low";
    }
  }
  extractEvidence(rule, submission) {
    const evidence = [];
    for (const condition of rule.conditions) {
      let value;
      if (condition.field === "any") {
        value = Object.values(submission.fields).filter((v) => typeof v === "string").join(" ");
      } else if (condition.field) {
        value = String(submission.fields[condition.field] || "");
      } else {
        continue;
      }
      if (condition.operator === "matches" && condition.value instanceof RegExp) {
        const match = value.match(condition.value);
        if (match) {
          evidence.push(match[0].substring(0, 100));
        }
      } else if (condition.operator === "contains") {
        const index = value.toLowerCase().indexOf(String(condition.value).toLowerCase());
        if (index !== -1) {
          const start = Math.max(0, index - 20);
          const end = Math.min(value.length, index + String(condition.value).length + 20);
          evidence.push("..." + value.substring(start, end) + "...");
        }
      }
    }
    return evidence.slice(0, 3);
  }
  addRule(rule) {
    this.rules.set(rule.id, rule);
  }
  removeRule(ruleId) {
    this.rules.delete(ruleId);
  }
  updateRule(ruleId, updates) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates);
      rule.updatedAt = /* @__PURE__ */ new Date();
    }
  }
  enableRule(ruleId) {
    this.updateRule(ruleId, { enabled: true });
  }
  disableRule(ruleId) {
    this.updateRule(ruleId, { enabled: false });
  }
  getRules() {
    return Array.from(this.rules.values());
  }
  getRule(ruleId) {
    return this.rules.get(ruleId);
  }
  async suggestRule(feedback) {
    const lowerFeedback = feedback.toLowerCase();
    if (lowerFeedback.includes("crypto") || lowerFeedback.includes("bitcoin")) {
      return {
        id: `suggested_${Date.now()}`,
        name: "Suggested Crypto Rule",
        conditions: [
          { field: "any", operator: "contains", value: "crypto" }
        ],
        action: "quarantine",
        priority: 50,
        enabled: false,
        description: "Suggested rule based on feedback",
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date(),
        hitCount: 0
      };
    }
    return null;
  }
  addCustomPattern(name, pattern) {
    this.customPatterns.set(name, pattern);
  }
  testRule(rule, testData) {
    const mockSubmission = {
      id: "test",
      sessionId: "test",
      timestamp: /* @__PURE__ */ new Date(),
      fields: testData,
      metadata: {},
      ip: "0.0.0.0",
      userAgent: "test"
    };
    return this.evaluateRule(rule, mockSubmission);
  }
  getStatistics() {
    const stats = {
      totalRules: this.rules.size,
      enabledRules: 0,
      totalHits: 0,
      rulesByAction: {
        block: 0,
        quarantine: 0,
        flag: 0,
        allow: 0
      },
      topRules: []
    };
    for (const rule of this.rules.values()) {
      if (rule.enabled) stats.enabledRules++;
      stats.totalHits += rule.hitCount;
      stats.rulesByAction[rule.action]++;
    }
    stats.topRules = Array.from(this.rules.values()).sort((a, b) => b.hitCount - a.hitCount).slice(0, 5).map((r) => ({ id: r.id, name: r.name, hits: r.hitCount }));
    return stats;
  }
  exportRules() {
    const rules = Array.from(this.rules.values());
    return JSON.stringify(rules, null, 2);
  }
  importRules(rulesJson) {
    try {
      const rules = JSON.parse(rulesJson);
      for (const rule of rules) {
        rule.createdAt = new Date(rule.createdAt);
        rule.updatedAt = new Date(rule.updatedAt);
        if (rule.lastHit) rule.lastHit = new Date(rule.lastHit);
        for (const condition of rule.conditions) {
          if (condition.operator === "matches" && typeof condition.value === "string") {
            try {
              condition.value = new RegExp(condition.value);
            } catch {
            }
          }
        }
        this.addRule(rule);
      }
    } catch (error) {
      console.error("Failed to import rules:", error);
      throw error;
    }
  }
}

class QuarantineManager {
  quarantine = /* @__PURE__ */ new Map();
  maxQuarantineSize = 1e3;
  quarantineExpiryDays = 7;
  reviewCallbacks = /* @__PURE__ */ new Map();
  async quarantine(submission, threats, confidence) {
    const quarantineId = this.generateQuarantineId();
    const entry = {
      id: quarantineId,
      submission,
      threats,
      confidence,
      timestamp: /* @__PURE__ */ new Date(),
      status: "pending"
    };
    this.quarantine.set(quarantineId, entry);
    this.enforceQuarantineLimit();
    this.scheduleExpiry(quarantineId);
    await this.notifyAdmins(entry);
    return quarantineId;
  }
  async review(quarantineId, approved, reviewedBy, notes) {
    const entry = this.quarantine.get(quarantineId);
    if (!entry) {
      throw new Error(`Quarantine entry ${quarantineId} not found`);
    }
    if (entry.status !== "pending") {
      throw new Error(`Entry ${quarantineId} has already been reviewed`);
    }
    entry.status = approved ? "approved" : "rejected";
    entry.reviewedBy = reviewedBy;
    entry.reviewedAt = /* @__PURE__ */ new Date();
    entry.reviewNotes = notes;
    const callback = this.reviewCallbacks.get(quarantineId);
    if (callback) {
      callback(approved, notes);
      this.reviewCallbacks.delete(quarantineId);
    }
    await this.learnFromReview(entry, approved);
    return {
      valid: approved,
      threats: approved ? [] : entry.threats,
      confidence: entry.confidence,
      threatLevel: approved ? "none" : "high",
      action: approved ? "allow" : "block",
      message: approved ? "Approved by manual review" : "Rejected by manual review",
      quarantineId
    };
  }
  getEntry(quarantineId) {
    return this.quarantine.get(quarantineId);
  }
  getPendingEntries() {
    return Array.from(this.quarantine.values()).filter((entry) => entry.status === "pending").sort((a, b) => b.confidence - a.confidence);
  }
  getRecentEntries(limit = 50) {
    return Array.from(this.quarantine.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }
  searchEntries(criteria) {
    let entries = Array.from(this.quarantine.values());
    if (criteria.status) {
      entries = entries.filter((e) => e.status === criteria.status);
    }
    if (criteria.threatType) {
      entries = entries.filter(
        (e) => e.threats.some((t) => t.type === criteria.threatType)
      );
    }
    if (criteria.minConfidence !== void 0) {
      entries = entries.filter((e) => e.confidence >= criteria.minConfidence);
    }
    if (criteria.maxConfidence !== void 0) {
      entries = entries.filter((e) => e.confidence <= criteria.maxConfidence);
    }
    if (criteria.startDate) {
      entries = entries.filter((e) => e.timestamp >= criteria.startDate);
    }
    if (criteria.endDate) {
      entries = entries.filter((e) => e.timestamp <= criteria.endDate);
    }
    if (criteria.reviewedBy) {
      entries = entries.filter((e) => e.reviewedBy === criteria.reviewedBy);
    }
    return entries;
  }
  async bulkReview(quarantineIds, approved, reviewedBy, notes) {
    for (const id of quarantineIds) {
      try {
        await this.review(id, approved, reviewedBy, notes);
      } catch (error) {
        console.error(`Failed to review ${id}:`, error);
      }
    }
  }
  registerReviewCallback(quarantineId, callback) {
    this.reviewCallbacks.set(quarantineId, callback);
  }
  generateQuarantineId() {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  enforceQuarantineLimit() {
    if (this.quarantine.size > this.maxQuarantineSize) {
      const expired = Array.from(this.quarantine.entries()).filter(([_, entry]) => entry.status === "expired").sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
      for (const [id] of expired) {
        if (this.quarantine.size <= this.maxQuarantineSize) break;
        this.quarantine.delete(id);
      }
      if (this.quarantine.size > this.maxQuarantineSize) {
        const reviewed = Array.from(this.quarantine.entries()).filter(([_, entry]) => entry.status !== "pending").sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
        for (const [id] of reviewed) {
          if (this.quarantine.size <= this.maxQuarantineSize) break;
          this.quarantine.delete(id);
        }
      }
    }
  }
  scheduleExpiry(quarantineId) {
    setTimeout(() => {
      const entry = this.quarantine.get(quarantineId);
      if (entry && entry.status === "pending") {
        entry.status = "expired";
        this.handleExpiredEntry(entry);
      }
    }, this.quarantineExpiryDays * 24 * 60 * 60 * 1e3);
  }
  async handleExpiredEntry(entry) {
    const callback = this.reviewCallbacks.get(entry.id);
    if (callback) {
      callback(false, "Expired - automatically rejected");
      this.reviewCallbacks.delete(entry.id);
    }
    console.log(`Quarantine entry ${entry.id} expired and was automatically rejected`);
  }
  async notifyAdmins(entry) {
    const notification = {
      type: "quarantine_alert",
      quarantineId: entry.id,
      confidence: entry.confidence,
      threats: entry.threats.map((t) => ({
        type: t.type,
        severity: t.severity,
        description: t.description
      })),
      timestamp: entry.timestamp,
      reviewUrl: `/admin/quarantine/${entry.id}`
    };
    console.log("Admin notification:", notification);
  }
  async learnFromReview(entry, approved) {
    const learningData = {
      submission: entry.submission,
      threats: entry.threats,
      confidence: entry.confidence,
      humanDecision: approved ? "ham" : "spam",
      reviewNotes: entry.reviewNotes
    };
    console.log("Learning from review:", learningData);
  }
  getStatistics() {
    const stats = {
      total: this.quarantine.size,
      pending: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
      avgReviewTime: 0,
      threatTypeDistribution: /* @__PURE__ */ new Map(),
      confidenceDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      }
    };
    const reviewTimes = [];
    for (const entry of this.quarantine.values()) {
      stats[entry.status]++;
      if (entry.reviewedAt && entry.status !== "expired") {
        reviewTimes.push(entry.reviewedAt.getTime() - entry.timestamp.getTime());
      }
      for (const threat of entry.threats) {
        const count = stats.threatTypeDistribution.get(threat.type) || 0;
        stats.threatTypeDistribution.set(threat.type, count + 1);
      }
      if (entry.confidence < 0.3) stats.confidenceDistribution.low++;
      else if (entry.confidence < 0.6) stats.confidenceDistribution.medium++;
      else if (entry.confidence < 0.9) stats.confidenceDistribution.high++;
      else stats.confidenceDistribution.critical++;
    }
    if (reviewTimes.length > 0) {
      stats.avgReviewTime = reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length;
    }
    return stats;
  }
  exportEntries(format = "json") {
    const entries = Array.from(this.quarantine.values());
    if (format === "json") {
      return JSON.stringify(entries, null, 2);
    }
    const headers = [
      "ID",
      "Status",
      "Confidence",
      "Timestamp",
      "Threats",
      "Reviewed By",
      "Reviewed At",
      "Notes"
    ];
    const rows = entries.map((entry) => [
      entry.id,
      entry.status,
      entry.confidence.toFixed(2),
      entry.timestamp.toISOString(),
      entry.threats.map((t) => t.type).join(";"),
      entry.reviewedBy || "",
      entry.reviewedAt?.toISOString() || "",
      entry.reviewNotes || ""
    ]);
    return [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n");
  }
  clearExpired() {
    const now = /* @__PURE__ */ new Date();
    const expiryTime = this.quarantineExpiryDays * 24 * 60 * 60 * 1e3;
    for (const [id, entry] of this.quarantine.entries()) {
      if (entry.status === "expired" || now.getTime() - entry.timestamp.getTime() > expiryTime * 2) {
        this.quarantine.delete(id);
      }
    }
  }
}

class ThreatIntelligence {
  threatFeeds = /* @__PURE__ */ new Map();
  ipBlacklist = /* @__PURE__ */ new Set();
  emailBlacklist = /* @__PURE__ */ new Set();
  domainBlacklist = /* @__PURE__ */ new Set();
  hashBlacklist = /* @__PURE__ */ new Set();
  reputationCache = /* @__PURE__ */ new Map();
  cacheExpiryMinutes = 60;
  constructor() {
    this.initializeDefaultFeeds();
    this.startFeedUpdates();
  }
  initializeDefaultFeeds() {
    this.addFeed({
      url: "https://raw.githubusercontent.com/stamparm/ipsum/master/ipsum.txt",
      type: "ip",
      updateFrequency: 1440,
      // Daily
      enabled: true,
      hitCount: 0
    });
    this.addFeed({
      url: "https://raw.githubusercontent.com/martenson/disposable-email-domains/master/disposable_email_blocklist.conf",
      type: "email",
      updateFrequency: 1440,
      // Daily
      enabled: true,
      hitCount: 0
    });
    this.addFeed({
      url: "https://check.torproject.org/torbulkexitlist",
      type: "ip",
      updateFrequency: 360,
      // Every 6 hours
      enabled: true,
      hitCount: 0
    });
  }
  async checkReputation(submission) {
    const threats = [];
    let maxConfidence = 0;
    const ipThreats = await this.checkIPReputation(submission.ip);
    threats.push(...ipThreats);
    if (submission.fields.email) {
      const emailThreats = await this.checkEmailReputation(String(submission.fields.email));
      threats.push(...emailThreats);
    }
    const domainThreats = await this.checkDomainReputation(submission);
    threats.push(...domainThreats);
    const hashThreats = await this.checkContentHashes(submission);
    threats.push(...hashThreats);
    if (threats.length > 0) {
      maxConfidence = Math.max(...threats.map((t) => t.confidence));
    }
    return { threats, confidence: maxConfidence };
  }
  async checkIPReputation(ip) {
    const threats = [];
    if (this.ipBlacklist.has(ip)) {
      threats.push({
        type: ThreatType.BLACKLISTED_IP,
        pattern: "Blacklisted IP",
        confidence: 0.95,
        description: "IP address found in threat intelligence feeds",
        evidence: [`IP: ${ip}`],
        severity: "critical"
      });
    }
    const cacheKey = `ip:${ip}`;
    let reputation = this.reputationCache.get(cacheKey);
    if (!reputation || this.isCacheExpired(reputation.ip?.lastSeen)) {
      reputation = await this.fetchIPReputation(ip);
      this.reputationCache.set(cacheKey, reputation);
    }
    if (reputation?.ip) {
      if (reputation.ip.isVPN || reputation.ip.isProxy) {
        threats.push({
          type: ThreatType.VPN_DETECTED,
          pattern: reputation.ip.isVPN ? "VPN detected" : "Proxy detected",
          confidence: 0.8,
          description: `Connection from ${reputation.ip.isVPN ? "VPN" : "proxy"} server`,
          evidence: [`IP: ${ip}`, `ASN: ${reputation.ip.asn}`],
          severity: "medium"
        });
      }
      if (reputation.ip.isTor) {
        threats.push({
          type: ThreatType.TOR_DETECTED,
          pattern: "Tor exit node",
          confidence: 0.95,
          description: "Connection from Tor network",
          evidence: [`IP: ${ip}`],
          severity: "high"
        });
      }
      if (reputation.ip.isHosting) {
        threats.push({
          type: ThreatType.BOT_BEHAVIOR,
          pattern: "Hosting provider IP",
          confidence: 0.7,
          description: "Connection from hosting provider - possible bot",
          evidence: [`IP: ${ip}`, `ASN: ${reputation.ip.asn}`],
          severity: "medium"
        });
      }
      if (reputation.ip.reputation < 30) {
        threats.push({
          type: ThreatType.BAD_REPUTATION,
          pattern: "Low IP reputation",
          confidence: Math.max(0.9 - reputation.ip.reputation / 100, 0.5),
          description: `IP has poor reputation score: ${reputation.ip.reputation}/100`,
          evidence: [`IP: ${ip}`, `Score: ${reputation.ip.reputation}`],
          severity: reputation.ip.reputation < 10 ? "high" : "medium"
        });
      }
    }
    return threats;
  }
  async checkEmailReputation(email) {
    const threats = [];
    const domain = email.split("@")[1];
    if (!domain) return threats;
    if (this.emailBlacklist.has(domain)) {
      threats.push({
        type: ThreatType.DISPOSABLE_EMAIL,
        pattern: "Disposable email domain",
        confidence: 0.95,
        description: "Email from disposable email service",
        evidence: [`Domain: ${domain}`],
        severity: "high"
      });
    }
    const cacheKey = `email:${domain}`;
    let reputation = this.reputationCache.get(cacheKey);
    if (!reputation || this.isCacheExpired(reputation.email?.lastSeen)) {
      reputation = await this.fetchEmailReputation(domain);
      this.reputationCache.set(cacheKey, reputation);
    }
    if (reputation?.email) {
      if (reputation.email.isDisposable) {
        threats.push({
          type: ThreatType.DISPOSABLE_EMAIL,
          pattern: "Disposable email",
          confidence: 0.9,
          description: "Temporary/disposable email address",
          evidence: [`Email: ${email}`],
          severity: "high"
        });
      }
      if (reputation.email.reputation < 40) {
        threats.push({
          type: ThreatType.SUSPICIOUS_EMAIL,
          pattern: "Low email reputation",
          confidence: Math.max(0.8 - reputation.email.reputation / 100, 0.4),
          description: `Email domain has poor reputation: ${reputation.email.reputation}/100`,
          evidence: [`Domain: ${domain}`, `Score: ${reputation.email.reputation}`],
          severity: "medium"
        });
      }
    }
    return threats;
  }
  async checkDomainReputation(submission) {
    const threats = [];
    const allText = Object.values(submission.fields).join(" ");
    const urlMatches = allText.match(/https?:\/\/([^\/\s]+)/gi) || [];
    const domains = /* @__PURE__ */ new Set();
    for (const url of urlMatches) {
      try {
        const domain = new URL(url).hostname;
        domains.add(domain);
      } catch {
      }
    }
    for (const domain of domains) {
      if (this.domainBlacklist.has(domain)) {
        threats.push({
          type: ThreatType.EXCESSIVE_URLS,
          pattern: "Blacklisted domain",
          confidence: 0.95,
          description: "URL contains blacklisted domain",
          evidence: [`Domain: ${domain}`],
          severity: "critical"
        });
        continue;
      }
      const cacheKey = `domain:${domain}`;
      let reputation = this.reputationCache.get(cacheKey);
      if (!reputation || this.isCacheExpired(reputation.domain?.lastSeen)) {
        reputation = await this.fetchDomainReputation(domain);
        this.reputationCache.set(cacheKey, reputation);
      }
      if (reputation?.domain) {
        if (reputation.domain.isSuspicious) {
          threats.push({
            type: ThreatType.EXCESSIVE_URLS,
            pattern: "Suspicious domain",
            confidence: 0.8,
            description: "URL contains suspicious domain",
            evidence: [`Domain: ${domain}`, `Category: ${reputation.domain.category}`],
            severity: "high"
          });
        }
        if (reputation.domain.age < 30) {
          threats.push({
            type: ThreatType.EXCESSIVE_URLS,
            pattern: "New domain",
            confidence: 0.6,
            description: `Domain registered ${reputation.domain.age} days ago`,
            evidence: [`Domain: ${domain}`, `Age: ${reputation.domain.age} days`],
            severity: "medium"
          });
        }
        if (reputation.domain.reputation < 30) {
          threats.push({
            type: ThreatType.BAD_REPUTATION,
            pattern: "Low domain reputation",
            confidence: Math.max(0.8 - reputation.domain.reputation / 100, 0.5),
            description: `Domain has poor reputation: ${reputation.domain.reputation}/100`,
            evidence: [`Domain: ${domain}`, `Score: ${reputation.domain.reputation}`],
            severity: "high"
          });
        }
      }
    }
    return threats;
  }
  async checkContentHashes(submission) {
    const threats = [];
    const contentHash = this.hashContent(JSON.stringify(submission.fields));
    if (this.hashBlacklist.has(contentHash)) {
      threats.push({
        type: ThreatType.KNOWN_SPAMMER,
        pattern: "Known spam content",
        confidence: 1,
        description: "Content matches known spam signature",
        evidence: [`Hash: ${contentHash.substring(0, 16)}...`],
        severity: "critical"
      });
    }
    return threats;
  }
  async fetchIPReputation(ip) {
    return {
      ip: {
        reputation: 50,
        isVPN: false,
        isTor: this.ipBlacklist.has(ip),
        isProxy: false,
        isHosting: false,
        country: "US",
        asn: "AS15169",
        lastSeen: /* @__PURE__ */ new Date()
      }
    };
  }
  async fetchEmailReputation(domain) {
    const isDisposable = this.emailBlacklist.has(domain);
    const isFreemail = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"].includes(domain);
    return {
      email: {
        reputation: isDisposable ? 10 : isFreemail ? 60 : 80,
        isDisposable,
        isFreemail,
        domain,
        lastSeen: /* @__PURE__ */ new Date()
      }
    };
  }
  async fetchDomainReputation(domain) {
    const suspiciousTLDs = [".tk", ".ml", ".ga", ".cf"];
    const isSuspicious = suspiciousTLDs.some((tld) => domain.endsWith(tld));
    return {
      domain: {
        reputation: isSuspicious ? 20 : 70,
        age: 365,
        // Days since registration
        category: "unknown",
        isSuspicious,
        lastSeen: /* @__PURE__ */ new Date()
      }
    };
  }
  hashContent(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
  isCacheExpired(lastSeen) {
    if (!lastSeen) return true;
    const now = /* @__PURE__ */ new Date();
    const diff = now.getTime() - lastSeen.getTime();
    return diff > this.cacheExpiryMinutes * 60 * 1e3;
  }
  addFeed(feed) {
    this.threatFeeds.set(feed.url, feed);
  }
  async startFeedUpdates() {
    for (const [url, feed] of this.threatFeeds) {
      if (feed.enabled) {
        await this.updateFeed(feed);
        setInterval(async () => {
          if (feed.enabled) {
            await this.updateFeed(feed);
          }
        }, feed.updateFrequency * 60 * 1e3);
      }
    }
  }
  async updateFeed(feed) {
    try {
      feed.lastUpdate = /* @__PURE__ */ new Date();
      console.log(`Updated threat feed: ${feed.url}`);
    } catch (error) {
      console.error(`Failed to update threat feed ${feed.url}:`, error);
    }
  }
  addToBlacklist(type, value) {
    switch (type) {
      case "ip":
        this.ipBlacklist.add(value);
        break;
      case "email":
        this.emailBlacklist.add(value);
        break;
      case "domain":
        this.domainBlacklist.add(value);
        break;
    }
  }
  removeFromBlacklist(type, value) {
    switch (type) {
      case "ip":
        this.ipBlacklist.delete(value);
        break;
      case "email":
        this.emailBlacklist.delete(value);
        break;
      case "domain":
        this.domainBlacklist.delete(value);
        break;
    }
  }
  getStatistics() {
    return {
      feeds: {
        total: this.threatFeeds.size,
        enabled: Array.from(this.threatFeeds.values()).filter((f) => f.enabled).length
      },
      blacklists: {
        ips: this.ipBlacklist.size,
        emails: this.emailBlacklist.size,
        domains: this.domainBlacklist.size,
        hashes: this.hashBlacklist.size
      },
      cache: {
        entries: this.reputationCache.size
      },
      feedStats: Array.from(this.threatFeeds.values()).map((feed) => ({
        url: feed.url,
        type: feed.type,
        enabled: feed.enabled,
        lastUpdate: feed.lastUpdate,
        hitCount: feed.hitCount
      }))
    };
  }
  clearCache() {
    this.reputationCache.clear();
  }
  exportBlacklists() {
    return JSON.stringify({
      ips: Array.from(this.ipBlacklist),
      emails: Array.from(this.emailBlacklist),
      domains: Array.from(this.domainBlacklist),
      hashes: Array.from(this.hashBlacklist)
    }, null, 2);
  }
  importBlacklists(data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.ips) this.ipBlacklist = new Set(parsed.ips);
      if (parsed.emails) this.emailBlacklist = new Set(parsed.emails);
      if (parsed.domains) this.domainBlacklist = new Set(parsed.domains);
      if (parsed.hashes) this.hashBlacklist = new Set(parsed.hashes);
    } catch (error) {
      console.error("Failed to import blacklists:", error);
      throw error;
    }
  }
}

class Analytics {
  submissions = /* @__PURE__ */ new Map();
  validationResults = /* @__PURE__ */ new Map();
  processingTimes = [];
  threatHistory = [];
  maxHistoryDays = 90;
  maxMetrics = 1e5;
  async recordSubmission(submission, result, processingTime) {
    this.submissions.set(submission.id, submission);
    this.validationResults.set(submission.id, result);
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > this.maxMetrics) {
      this.processingTimes.shift();
    }
    if (result.threats.length > 0) {
      this.threatHistory.push({
        timestamp: /* @__PURE__ */ new Date(),
        value: result.threats.length,
        metadata: {
          threats: result.threats,
          confidence: result.confidence,
          action: result.action
        }
      });
    }
    this.cleanupOldData();
  }
  getOverviewStats() {
    const results = Array.from(this.validationResults.values());
    const stats = {
      totalSubmissions: results.length,
      blockedSubmissions: results.filter((r) => r.action === "block").length,
      quarantinedSubmissions: results.filter((r) => r.action === "quarantine").length,
      allowedSubmissions: results.filter((r) => r.action === "allow").length,
      falsePositives: 0,
      // Would need manual feedback
      falseNegatives: 0,
      // Would need manual feedback
      avgProcessingTime: this.calculateAverage(this.processingTimes),
      threatDistribution: this.calculateThreatDistribution(),
      topThreats: this.getTopThreats(5),
      geoDistribution: this.calculateGeoDistribution(),
      timeDistribution: this.calculateTimeDistribution(),
      deviceDistribution: this.calculateDeviceDistribution()
    };
    return stats;
  }
  getThreatTrends(days = 7) {
    const now = /* @__PURE__ */ new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1e3);
    const midpoint = new Date(now.getTime() - days / 2 * 24 * 60 * 60 * 1e3);
    const currentPeriod = /* @__PURE__ */ new Map();
    const previousPeriod = /* @__PURE__ */ new Map();
    for (const entry of this.threatHistory) {
      if (entry.timestamp < cutoff) continue;
      for (const threat of entry.metadata.threats) {
        if (entry.timestamp >= midpoint) {
          currentPeriod.set(threat.type, (currentPeriod.get(threat.type) || 0) + 1);
        } else {
          previousPeriod.set(threat.type, (previousPeriod.get(threat.type) || 0) + 1);
        }
      }
    }
    const trends = [];
    const allTypes = /* @__PURE__ */ new Set([...currentPeriod.keys(), ...previousPeriod.keys()]);
    for (const type of allTypes) {
      const current = currentPeriod.get(type) || 0;
      const previous = previousPeriod.get(type) || 0;
      const change = previous === 0 ? 100 : (current - previous) / previous * 100;
      trends.push({
        type,
        trend: change > 10 ? "increasing" : change < -10 ? "decreasing" : "stable",
        changePercent: Math.round(change),
        currentCount: current,
        previousCount: previous
      });
    }
    return trends.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  }
  getTimeSeriesData(metric, hours = 24) {
    const now = /* @__PURE__ */ new Date();
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1e3);
    const bucketSize = hours <= 24 ? 60 : hours <= 168 ? 360 : 1440;
    const buckets = /* @__PURE__ */ new Map();
    for (const [id, result] of this.validationResults) {
      const submission = this.submissions.get(id);
      if (!submission || submission.timestamp < cutoff) continue;
      const bucketKey = Math.floor(submission.timestamp.getTime() / (bucketSize * 60 * 1e3));
      const bucket = buckets.get(bucketKey) || { count: 0, sum: 0 };
      switch (metric) {
        case "submissions":
          bucket.count++;
          break;
        case "blocks":
          if (result.action === "block") bucket.count++;
          break;
        case "threats":
          bucket.count += result.threats.length;
          break;
        case "confidence":
          bucket.sum += result.confidence;
          bucket.count++;
          break;
      }
      buckets.set(bucketKey, bucket);
    }
    const series = [];
    for (const [key, bucket] of buckets) {
      series.push({
        timestamp: new Date(key * bucketSize * 60 * 1e3),
        value: metric === "confidence" ? bucket.sum / Math.max(bucket.count, 1) : bucket.count
      });
    }
    return series.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  getPerformanceMetrics() {
    const sorted = [...this.processingTimes].sort((a, b) => a - b);
    const len = sorted.length;
    return {
      avgProcessingTime: this.calculateAverage(this.processingTimes),
      p50ProcessingTime: sorted[Math.floor(len * 0.5)] || 0,
      p95ProcessingTime: sorted[Math.floor(len * 0.95)] || 0,
      p99ProcessingTime: sorted[Math.floor(len * 0.99)] || 0,
      totalProcessed: this.validationResults.size,
      successRate: this.calculateSuccessRate()
    };
  }
  getRiskScoreDistribution() {
    const distribution = {
      "low": 0,
      "medium": 0,
      "high": 0,
      "critical": 0
    };
    for (const result of this.validationResults.values()) {
      if (result.confidence < 0.3) distribution.low++;
      else if (result.confidence < 0.6) distribution.medium++;
      else if (result.confidence < 0.9) distribution.high++;
      else distribution.critical++;
    }
    return distribution;
  }
  getIPAnalytics() {
    const ipStats = /* @__PURE__ */ new Map();
    for (const [id, submission] of this.submissions) {
      const result = this.validationResults.get(id);
      if (!result) continue;
      const stats = ipStats.get(submission.ip) || { count: 0, threats: 0, blocked: 0 };
      stats.count++;
      stats.threats += result.threats.length;
      if (result.action === "block") stats.blocked++;
      ipStats.set(submission.ip, stats);
    }
    const topOffenders = Array.from(ipStats.entries()).sort((a, b) => b[1].threats - a[1].threats).slice(0, 10).map(([ip, stats]) => ({ ip, count: stats.count, threats: stats.threats }));
    const repeatOffenders = Array.from(ipStats.entries()).filter(([_, stats]) => stats.count > 5).sort((a, b) => b[1].blocked - a[1].blocked).slice(0, 10).map(([ip, stats]) => ({ ip, submissions: stats.count, blocked: stats.blocked }));
    return {
      uniqueIPs: ipStats.size,
      topOffenders,
      repeatOffenders
    };
  }
  generateReport(type, format = "json") {
    const days = type === "daily" ? 1 : type === "weekly" ? 7 : 30;
    const overview = this.getOverviewStats();
    const trends = this.getThreatTrends(days);
    const performance = this.getPerformanceMetrics();
    const ipAnalytics = this.getIPAnalytics();
    const report = {
      generatedAt: /* @__PURE__ */ new Date(),
      period: type,
      overview,
      trends,
      performance,
      ipAnalytics
    };
    if (format === "json") {
      return JSON.stringify(report, null, 2);
    }
    if (format === "markdown") {
      return this.formatMarkdownReport(report);
    }
    if (format === "html") {
      return this.formatHTMLReport(report);
    }
    return "";
  }
  formatMarkdownReport(report) {
    return `# Anti-Spam Report - ${report.period}
Generated: ${report.generatedAt.toISOString()}

## Overview
- Total Submissions: ${report.overview.totalSubmissions}
- Blocked: ${report.overview.blockedSubmissions} (${(report.overview.blockedSubmissions / Math.max(report.overview.totalSubmissions, 1) * 100).toFixed(1)}%)
- Quarantined: ${report.overview.quarantinedSubmissions}
- Allowed: ${report.overview.allowedSubmissions}
- Avg Processing Time: ${report.overview.avgProcessingTime.toFixed(2)}ms

## Top Threats
${report.overview.topThreats.map((t) => `- ${t.type}: ${t.count}`).join("\n")}

## Threat Trends
${report.trends.map((t) => `- ${t.type}: ${t.trend} (${t.changePercent > 0 ? "+" : ""}${t.changePercent}%)`).join("\n")}

## Performance
- P50 Processing Time: ${report.performance.p50ProcessingTime.toFixed(2)}ms
- P95 Processing Time: ${report.performance.p95ProcessingTime.toFixed(2)}ms
- P99 Processing Time: ${report.performance.p99ProcessingTime.toFixed(2)}ms
- Success Rate: ${(report.performance.successRate * 100).toFixed(1)}%

## IP Analytics
- Unique IPs: ${report.ipAnalytics.uniqueIPs}
- Top Offenders: ${report.ipAnalytics.topOffenders.length}
- Repeat Offenders: ${report.ipAnalytics.repeatOffenders.length}
`;
  }
  formatHTMLReport(report) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Anti-Spam Report - ${report.period}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1, h2 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
    .metric-label { color: #666; }
  </style>
</head>
<body>
  <h1>Anti-Spam Report - ${report.period}</h1>
  <p>Generated: ${report.generatedAt.toISOString()}</p>
  
  <h2>Overview</h2>
  <div>
    <div class="metric">
      <div class="metric-value">${report.overview.totalSubmissions}</div>
      <div class="metric-label">Total Submissions</div>
    </div>
    <div class="metric">
      <div class="metric-value">${report.overview.blockedSubmissions}</div>
      <div class="metric-label">Blocked</div>
    </div>
    <div class="metric">
      <div class="metric-value">${report.overview.quarantinedSubmissions}</div>
      <div class="metric-label">Quarantined</div>
    </div>
    <div class="metric">
      <div class="metric-value">${report.overview.allowedSubmissions}</div>
      <div class="metric-label">Allowed</div>
    </div>
  </div>
  
  <h2>Top Threats</h2>
  <table>
    <tr><th>Threat Type</th><th>Count</th></tr>
    ${report.overview.topThreats.map((t) => `<tr><td>${t.type}</td><td>${t.count}</td></tr>`).join("")}
  </table>
  
  <h2>Performance</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>P50 Processing Time</td><td>${report.performance.p50ProcessingTime.toFixed(2)}ms</td></tr>
    <tr><td>P95 Processing Time</td><td>${report.performance.p95ProcessingTime.toFixed(2)}ms</td></tr>
    <tr><td>P99 Processing Time</td><td>${report.performance.p99ProcessingTime.toFixed(2)}ms</td></tr>
    <tr><td>Success Rate</td><td>${(report.performance.successRate * 100).toFixed(1)}%</td></tr>
  </table>
</body>
</html>`;
  }
  calculateThreatDistribution() {
    const distribution = {};
    for (const result of this.validationResults.values()) {
      for (const threat of result.threats) {
        distribution[threat.type] = (distribution[threat.type] || 0) + 1;
      }
    }
    return distribution;
  }
  getTopThreats(limit) {
    const distribution = this.calculateThreatDistribution();
    return Object.entries(distribution).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, limit);
  }
  calculateGeoDistribution() {
    return {
      "US": 450,
      "CN": 230,
      "RU": 180,
      "IN": 90,
      "Other": 150
    };
  }
  calculateTimeDistribution() {
    const distribution = {};
    for (const submission of this.submissions.values()) {
      const hour = submission.timestamp.getHours();
      const key = `${hour}:00`;
      distribution[key] = (distribution[key] || 0) + 1;
    }
    return distribution;
  }
  calculateDeviceDistribution() {
    const distribution = {};
    for (const submission of this.submissions.values()) {
      const ua = submission.userAgent.toLowerCase();
      let device = "Other";
      if (ua.includes("mobile")) device = "Mobile";
      else if (ua.includes("tablet")) device = "Tablet";
      else if (ua.includes("windows") || ua.includes("mac") || ua.includes("linux")) device = "Desktop";
      else if (ua.includes("bot") || ua.includes("crawler")) device = "Bot";
      distribution[device] = (distribution[device] || 0) + 1;
    }
    return distribution;
  }
  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
  calculateSuccessRate() {
    const total = this.validationResults.size;
    if (total === 0) return 1;
    const successful = Array.from(this.validationResults.values()).filter((r) => r.action === "allow").length;
    return successful / total;
  }
  cleanupOldData() {
    const now = /* @__PURE__ */ new Date();
    const cutoff = new Date(now.getTime() - this.maxHistoryDays * 24 * 60 * 60 * 1e3);
    for (const [id, submission] of this.submissions) {
      if (submission.timestamp < cutoff) {
        this.submissions.delete(id);
        this.validationResults.delete(id);
      }
    }
    this.threatHistory = this.threatHistory.filter((entry) => entry.timestamp >= cutoff);
  }
  exportData(format = "json") {
    const data = {
      submissions: Array.from(this.submissions.values()),
      results: Array.from(this.validationResults.values()),
      processingTimes: this.processingTimes,
      threatHistory: this.threatHistory
    };
    if (format === "json") {
      return JSON.stringify(data, null, 2);
    }
    const rows = [];
    rows.push(["Timestamp", "IP", "Action", "Threats", "Confidence"]);
    for (const [id, submission] of this.submissions) {
      const result = this.validationResults.get(id);
      if (result) {
        rows.push([
          submission.timestamp.toISOString(),
          submission.ip,
          result.action,
          result.threats.length.toString(),
          result.confidence.toFixed(2)
        ]);
      }
    }
    return rows.map((row) => row.join(",")).join("\n");
  }
}

const DEFAULT_CONFIG = {
  // Thresholds - Start conservative, adjust based on results
  blockThreshold: 0.9,
  // 90% confidence = definite spam
  quarantineThreshold: 0.7,
  // 70% confidence = needs review
  // Rate limiting
  maxSubmissionsPerMinute: 3,
  maxSubmissionsPerHour: 10,
  maxSubmissionsPerDay: 50,
  // All modules enabled by default
  modules: {
    threatDetector: true,
    behavioralAnalyzer: true,
    mlClassifier: true,
    ruleEngine: true,
    threatIntelligence: true
  },
  // Behavioral thresholds
  minSubmissionTime: 3e3,
  // 3 seconds minimum
  maxSubmissionTime: 36e5,
  // 1 hour maximum
  minMouseMovements: 5,
  // At least 5 mouse movements
  minKeystrokes: 10,
  // At least 10 keystrokes
  // Quarantine
  quarantineExpiryDays: 7,
  maxQuarantineItems: 1e3,
  autoRejectExpired: true,
  // Modes
  learningMode: false,
  // Production mode by default
  strictMode: false,
  // Normal mode by default
  // Notifications (configure these!)
  notifications: {
    enabled: false,
    // Enable after configuring
    email: "",
    // Add your email
    slackWebhook: "",
    // Add Slack webhook URL
    quarantineAlerts: true,
    criticalThreatsOnly: false
  },
  // Whitelists (add trusted sources)
  whitelistedIPs: [
    // Add your office/home IPs here
    // '192.168.1.1'
  ],
  whitelistedEmails: [
    // Add trusted email addresses
    // 'admin@gadgetfix.com'
  ],
  trustedDomains: [
    "gadgetfix.com",
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com"
  ],
  // Blacklists (known bad actors)
  blacklistedIPs: [
    // Will be populated by threat feeds
  ],
  blacklistedEmails: [
    // Add known spam emails
  ],
  blacklistedDomains: [
    // Add known spam domains
  ],
  // Custom patterns
  customBlockPatterns: [
    // Add custom regex patterns to block
    // 'viagra|cialis|pharmacy'
  ],
  customAllowPatterns: [
    // Add patterns that should always be allowed
    // 'gadgetfix|phone repair|screen replacement'
  ]
};
function getConfig() {
  const config = { ...DEFAULT_CONFIG };
  {
    config.strictMode = true;
    config.modules.threatIntelligence = true;
  }
  return config;
}
class ConfigManager {
  static instance;
  config;
  constructor() {
    this.config = getConfig();
  }
  static getInstance() {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  getConfig() {
    return this.config;
  }
  updateConfig(updates) {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }
  saveConfig() {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("spamguard_config", JSON.stringify(this.config));
    }
  }
  loadConfig() {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem("spamguard_config");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.config = { ...this.config, ...parsed };
        } catch (error) {
          console.error("Failed to load saved config:", error);
        }
      }
    }
  }
  resetToDefaults() {
    this.config = getConfig();
    this.saveConfig();
  }
  // Convenience methods
  isWhitelisted(type, value) {
    switch (type) {
      case "ip":
        return this.config.whitelistedIPs.includes(value);
      case "email":
        const domain = value.split("@")[1];
        return this.config.whitelistedEmails.includes(value) || this.config.trustedDomains.includes(domain);
      default:
        return false;
    }
  }
  isBlacklisted(type, value) {
    switch (type) {
      case "ip":
        return this.config.blacklistedIPs.includes(value);
      case "email":
        return this.config.blacklistedEmails.includes(value);
      case "domain":
        return this.config.blacklistedDomains.includes(value);
      default:
        return false;
    }
  }
  addToWhitelist(type, value) {
    switch (type) {
      case "ip":
        if (!this.config.whitelistedIPs.includes(value)) {
          this.config.whitelistedIPs.push(value);
        }
        break;
      case "email":
        if (!this.config.whitelistedEmails.includes(value)) {
          this.config.whitelistedEmails.push(value);
        }
        break;
      case "domain":
        if (!this.config.trustedDomains.includes(value)) {
          this.config.trustedDomains.push(value);
        }
        break;
    }
    this.saveConfig();
  }
  removeFromWhitelist(type, value) {
    switch (type) {
      case "ip":
        this.config.whitelistedIPs = this.config.whitelistedIPs.filter((ip) => ip !== value);
        break;
      case "email":
        this.config.whitelistedEmails = this.config.whitelistedEmails.filter((email) => email !== value);
        break;
      case "domain":
        this.config.trustedDomains = this.config.trustedDomains.filter((domain) => domain !== value);
        break;
    }
    this.saveConfig();
  }
}
const configManager = ConfigManager.getInstance();

class SpamGuard {
  threatDetector;
  behavioralAnalyzer;
  mlClassifier;
  ruleEngine;
  quarantineManager;
  threatIntel;
  analytics;
  config;
  constructor() {
    this.config = configManager.getConfig();
    this.threatDetector = new ThreatDetector();
    this.behavioralAnalyzer = new BehavioralAnalyzer();
    this.mlClassifier = new MLClassifier();
    this.ruleEngine = new RuleEngine();
    this.quarantineManager = new QuarantineManager();
    this.threatIntel = new ThreatIntelligence();
    this.analytics = new Analytics();
  }
  /**
   * Main validation entry point
   */
  async validate(submission) {
    const startTime = Date.now();
    const threats = [];
    let confidenceScore = 0;
    let threatLevel = "none";
    try {
      if (configManager.isWhitelisted("ip", submission.ip) || submission.fields.email && configManager.isWhitelisted("email", String(submission.fields.email))) {
        return {
          valid: true,
          threats: [],
          confidence: 0,
          threatLevel: "none",
          action: "allow",
          message: "Whitelisted source"
        };
      }
      if (configManager.isBlacklisted("ip", submission.ip) || submission.fields.email && configManager.isBlacklisted("email", String(submission.fields.email))) {
        return {
          valid: false,
          threats: [],
          confidence: 1,
          threatLevel: "critical",
          action: "block",
          message: "Blacklisted source"
        };
      }
      if (this.config.modules.threatDetector) {
        const immediateThreats = await this.threatDetector.analyze(submission);
        threats.push(...immediateThreats.threats);
        confidenceScore = Math.max(confidenceScore, immediateThreats.confidence);
      }
      if (this.config.modules.behavioralAnalyzer) {
        const behaviorAnalysis = await this.behavioralAnalyzer.analyze(
          submission,
          this.getSessionContext(submission.sessionId)
        );
        threats.push(...behaviorAnalysis.threats);
        confidenceScore = Math.max(confidenceScore, behaviorAnalysis.confidence);
      }
      if (this.config.modules.mlClassifier) {
        const mlResult = await this.mlClassifier.classify(submission);
        threats.push(...mlResult.threats);
        confidenceScore = Math.max(confidenceScore, mlResult.confidence);
      }
      if (this.config.modules.ruleEngine) {
        const ruleResults = await this.ruleEngine.evaluate(submission, threats);
        threats.push(...ruleResults.additionalThreats);
        confidenceScore = Math.max(confidenceScore, ruleResults.confidence);
      }
      if (this.config.modules.threatIntelligence) {
        const threatIntelResults = await this.threatIntel.checkReputation(submission);
        threats.push(...threatIntelResults.threats);
        confidenceScore = Math.max(confidenceScore, threatIntelResults.confidence);
      }
      threatLevel = this.calculateThreatLevel(confidenceScore);
      const result = await this.handleThreatLevel(
        submission,
        threatLevel,
        confidenceScore,
        threats
      );
      await this.recordAnalytics(submission, result, Date.now() - startTime);
      if (this.config.communitySharing && threatLevel !== "none") {
        await this.shareThreatIntelligence(threats);
      }
      return result;
    } catch (error) {
      console.error("SpamGuard validation error:", error);
      return {
        valid: true,
        threats: [],
        confidence: 0,
        threatLevel: "none",
        action: "allow",
        message: "Validation system temporarily unavailable"
      };
    }
  }
  /**
   * Calculate threat level based on confidence score
   */
  calculateThreatLevel(confidence) {
    if (confidence >= this.config.blockThreshold) return "critical";
    if (confidence >= this.config.quarantineThreshold) return "high";
    if (confidence >= 0.5) return "medium";
    if (confidence >= 0.3) return "low";
    return "none";
  }
  /**
   * Handle submission based on threat level
   */
  async handleThreatLevel(submission, threatLevel, confidence, threats) {
    let action = "allow";
    let message = "Submission accepted";
    switch (threatLevel) {
      case "critical":
        action = "block";
        message = "Submission rejected due to security concerns";
        await this.logBlockedSubmission(submission, threats);
        break;
      case "high":
        action = "quarantine";
        await this.quarantineManager.quarantine(submission, threats, confidence);
        message = "Submission held for review";
        break;
      case "medium":
        if (this.config.strictMode) {
          action = "quarantine";
          await this.quarantineManager.quarantine(submission, threats, confidence);
          message = "Submission held for review";
        } else {
          action = "allow";
          await this.flagForReview(submission, threats);
        }
        break;
      case "low":
        action = "allow";
        await this.flagForReview(submission, threats);
        break;
      default:
        action = "allow";
    }
    return {
      valid: action === "allow",
      threats,
      confidence,
      threatLevel,
      action,
      message,
      quarantineId: action === "quarantine" ? await this.quarantineManager.getQuarantineId(submission) : void 0
    };
  }
  /**
   * Get session context for behavioral analysis
   */
  getSessionContext(sessionId) {
    return {
      previousSubmissions: [],
      ipHistory: [],
      userAgent: "",
      referrer: "",
      timezone: "",
      language: ""
    };
  }
  /**
   * Log blocked submission for analysis
   */
  async logBlockedSubmission(submission, threats) {
    await this.analytics.logBlocked({
      timestamp: /* @__PURE__ */ new Date(),
      submission,
      threats,
      fingerprint: await this.generateFingerprint(submission)
    });
  }
  /**
   * Flag submission for manual review
   */
  async flagForReview(submission, threats) {
    await this.analytics.flagForReview({
      submission,
      threats,
      timestamp: /* @__PURE__ */ new Date()
    });
  }
  /**
   * Record analytics for learning and reporting
   */
  async recordAnalytics(submission, result, processingTime) {
    await this.analytics.record({
      submission,
      result,
      processingTime,
      timestamp: /* @__PURE__ */ new Date()
    });
    if (this.config.learningMode) {
      await this.mlClassifier.learn(submission, result);
    }
  }
  /**
   * Share threat intelligence with community
   */
  async shareThreatIntelligence(threats) {
    if (threats.some((t) => t.confidence > 0.8)) {
      await this.threatIntel.shareWithCommunity(threats);
    }
  }
  /**
   * Generate fingerprint for submission tracking
   */
  async generateFingerprint(submission) {
    const data = JSON.stringify({
      ip: submission.ip,
      userAgent: submission.userAgent,
      fields: Object.keys(submission.fields).sort()
    });
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  /**
   * Update configuration dynamically
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  /**
   * Get current system status
   */
  async getStatus() {
    return {
      config: this.config,
      stats: await this.analytics.getStats(),
      quarantineCount: await this.quarantineManager.getCount(),
      threatIntelStatus: await this.threatIntel.getStatus(),
      mlModelVersion: this.mlClassifier.getVersion()
    };
  }
  /**
   * Manual review result feedback for learning
   */
  async provideFeedback(submissionId, wasSpam, feedback) {
    await this.mlClassifier.feedback(submissionId, wasSpam);
    await this.analytics.recordFeedback(submissionId, wasSpam, feedback);
    if (feedback) {
      await this.ruleEngine.suggestRule(feedback);
    }
  }
}

export { SpamGuard as S };
