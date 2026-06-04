---
title: "Browser Fingerprinting Explained — Can You Stop It? (2026)"
date: "2025-04-28"
excerpt: "Browser fingerprinting tracks you without cookies — nothing to clear, yet you're still identified. Find out how it works and whether you can stop it."
coverImage: "/blog/what-is-browser-fingerprinting.png"
category: "Privacy Basics"
author: "Permission Trail Team"
readTime: "5 min read"
---

Most people know that websites track you through cookies. What fewer people know is that websites can track you without storing anything at all. This technique is called browser fingerprinting, and it's become one of the harder tracking methods to deal with.

## What Is a Browser Fingerprint?

Every browser has a slightly different combination of settings, plugins, fonts, screen resolution, hardware, and behaviour. When you visit a website, it can ask your browser for this information and combine it into a profile that's unique enough to identify you.

Your browser fingerprint typically includes:

- User agent string (your browser name, version, and operating system)
- Screen resolution and colour depth
- Installed fonts
- Browser plugins and extensions
- Time zone and language settings
- Hardware concurrency (number of CPU cores your device reports)
- Canvas fingerprint (how your device renders graphics)
- Audio fingerprint (how your device processes audio)

Individually, none of these are identifying. Together, they form a combination that is statistically unique to your device in the vast majority of cases. Research from the Electronic Frontier Foundation found that over 80% of browsers can be uniquely identified this way.

## How Is It Different from Cookies?

Cookies are stored in your browser. You can clear them, block them, or inspect them. Fingerprinting doesn't require storing anything. The tracking happens entirely on the server side. The website collects your attributes, generates a hash, and stores that on their end.

This means:
- Clearing your cookies doesn't help
- Private browsing mode doesn't help much either
- Ad blockers don't stop it unless they specifically target fingerprinting scripts

This is why [clearing cookies alone isn't enough to protect your privacy](/blog/why-clearing-cookies-isnt-enough) — fingerprinting operates outside any storage you could clear.

## Canvas Fingerprinting

The most widely used technique is canvas fingerprinting. Your browser is asked to draw something (a piece of text, a shape) on a hidden canvas element. The exact way pixels are rendered varies subtly between different hardware and software combinations. The resulting image is hashed and used as an identifier.

Most users have no idea this is happening.

## Audio Fingerprinting

Similar to canvas fingerprinting, audio fingerprinting asks your browser to process an audio signal. The subtle differences in how your device handles audio processing create another unique identifier.

## Is Fingerprinting Legal?

In many cases, yes, though it's a grey area. Under GDPR, collecting identifying information requires either consent or a legitimate interest basis. Many companies collect fingerprint data without explicit consent, which is increasingly being challenged by regulators.

## What Can You Do About It?

Complete prevention is difficult. A few practical options:

**Use Firefox with privacy extensions.** Firefox with uBlock Origin and Privacy Badger blocks many fingerprinting scripts. The Tor Browser goes further by making all users look identical to each other.

**Use Brave.** Brave has built-in fingerprint randomisation that introduces small random variations into your canvas and audio outputs, making your fingerprint inconsistent across sessions.

**Be selective about where you care.** Fingerprinting is most common on advertising networks, social media platforms, and analytics-heavy news sites. On sites you trust and use regularly, it's less of a concern.

## How Fingerprinting Fits Into the Bigger Picture

Fingerprinting is usually used alongside cookies and local storage, not instead of them. Trackers use fingerprinting to link your browsing sessions when cookies have been cleared, or to reconnect you to a profile when you switch browsers.

For a broader look at all the techniques websites use to follow you around the web, see our guide on [7 ways websites track you beyond cookies](/blog/what-are-browser-trackers).

This is why understanding all the ways websites track you matters. Cookies are the most visible layer. Fingerprinting is the fallback that makes cookie-clearing less effective than most people assume.

Tools like [Permission Trail](https://www.permissiontrail.co.uk/) help you manage the storage-based tracking that happens in your browser. For fingerprinting specifically, browser choice and extensions are your main line of defence.
