# Software Requirements Specification (SRS) for NeighbourLink (Neighborhood Focus)

**Version:** 1.1  
**Date:** April 20, 2025


## 1. Introduction

### 1.1 Purpose
NeighbourLink is a hyperlocal platform connecting neighbors to share resources (e.g., tools, medical equipment) and provide urgent assistance within their immediate community.

### 1.2 Scope
- **Target Users:** Residents within a defined neighborhood (1–15 km radius).
- **Key Features:**
  - Connect with nearby people
  - Post and search for resources.
  - Emergency alerts for critical needs.
  - Ability to add upcoming events in the locality to update the local people.
  - Ability to promote business and ideas (for commercial use).
  - Ability to update the locality about any issues or construction updates.
  - Trust-building tools (user verification through Govt ID).
  - Secure in-app communication.
  - Community skill exchange to make more reliable bondings by utilising the skills of the local people.
  - Community of local volunteers for quick and direct communication with the needy.
  - Local language support.
  - Location (meeting) support.
  - In-app notification support.
  - Update and commenting system for continuous local updates.

### 1.3 Out of Scope (Future)
- School/college or workplace-specific hubs.
- Event-based temporary communities.
- Connecting local police stations and NGO's.

### 1.4 Business Scope

#### 1.4.1 Core Business Opportunity
NeighbourLink builds a distinct community-driven digital marketplace that bridges residents and local businesses in ways that classic platforms do not. By prioritizing proximity-based relationships within a 1-15 km range, the site allows businesses to reach exactly the right customers that count most - those directly within physical proximity.

#### 1.4.2 Business Promotion Features

##### 1. Hyperlocal Marketing System
- **Targeted Visibility:** Businesses are able to craft promotion posts viewed by users in their specified area (1-15 km)
- **Media-Rich Presentations:** Multi-image and video support to represent products or services effectively
- **Duration Control:** Businesses can specify specific time frames for promotions (for example, 7 days, 30 days) to coincide with business cycles

##### 2. Creation of Business Profiles
- **Verified Business Credentials:** "Verified Business" badges build consumer trust
- **Complete Contact Management:** Organized presentation of business name, contact details, and email
- **Location Integration:** Map-based business discovery with accurate location services

##### 3. Direct Consumer Engagement
- **Secure Business Chat:** End-to-end encrypted messaging between businesses and prospective customers
- **Privacy-Preserving Communication:** No phone number exposure while still having direct contact
- **Media Sharing:** Ability to share more product/service information in conversations

##### 4. Analytics & Performance Metrics
- **Promotion Tracking:** Businesses are able to track saved/shared counts
- **Visibility Analytics:** Data on promotion reach among neighborhood demographics

#### 1.4.3 Monetization Strategy
The platform follows a multi-level business model:

##### Freemium Structure:
- Free basic business listings within 5km radius
- Promotional reach in extended radius (5-15km) attracts charges
- Premium placement features for increased visibility

##### Duration-Based Pricing:
- Short-term promotions (less than 7 days) at discounted rates
- Extended promotional periods with higher pricing
- Featured promotion features for maximum visibility

##### Value-Added Services:
- Advanced media display features (multiple images, videos)
- Business verification services
- Analytics and reporting tools

#### 1.4.4 Additional Commercial Opportunities

##### Local Event Monetization
- **Event Sponsorship:** Companies sponsor community events for greater exposure
- **Ticketed Events:** Support for paid community events with built-in payment processing
- **Event-Promotion Packages:** Integrated promotional and event hosting features

##### Skill Exchange Marketplace
- **Service Provider Listings:** Local experts promote specialized skills
- **Commission Structure:** Platform share on successful service transactions
- **Featured Skill Promotion:** Greater exposure for premium skill providers

##### Community-Commercial Integration
- **Reputation-Based Promotion:** Greater exposure for businesses with high community participation
- **Cross-Promotion Opportunities:** Between commercial offerings and resource sharing
- **Collaborative Marketing:** Complementary local businesses coming together for joint promotions

#### 1.4.5 Competitive Business Advantage
NeighbourLink generates one-of-a-kind business value by:
- **Trust-First Approach:** Verification systems generate a more qualified audience for businesses
- **Genuine Local Focus:** Authentic hyperlocal reach in contrast to broad-based platforms
- **Community Context:** Businesses interact with consumers within a community-focused context
- **Emergency Response Integration:** Business visibility at times of urgent neighborhood needs
- **Multi-Language Support:** Engage with diverse neighborhood demographics through translation support

The business scope effectively balances commercial interests with community needs, creating sustainable revenue opportunities while maintaining the platform's core neighborhood assistance mission.

## 2. Overall Description

### 2.1 User Needs
- Quickly locate nearby resources during emergencies (e.g., oxygen cylinders).
- Share underutilized items (e.g., tools, books) with trusted neighbours.
- Maintain privacy while requesting/receiving help by keeping their contact details hidden.
- Get upcoming event updates happening in the locality.
- Get local issue and construction updates of the locality.
- Find and offer specialized skills within the neighborhood.
- Communicate in preferred local language.
- Coordinate meeting locations for resource exchanges.
- Stay updated through notifications.

### 2.2 System Features

#### Core Features:
1. **User Authentication & Verification**
   - Sign-up via email.
   - Optional ID verification for "Trusted Neighbor" badges.
   - User profile management.

2. **Resource Sharing**
   - Post requests/offers with categories (Medical, Tools, Books).
   - Post requests and offers with photos and categories.
   - Search within customizable neighbourhood radius.

3. **Emergency Alerts**
   - Broadcast urgent needs to neighbours within 5km area.
   - Send notifications via push alerts.
   - Priority system for critical needs.

4. **In-App Communication**
   - Encrypted chat (no phone number sharing).
   - Photo uploads for item verification.
   - In-chat access to MAP for scheduling location for meetup/resource exchange.

5. **Trust & Safety**
   - Anonymous posting for sensitive requests.
   - User verification by Govt. ID.

6. **Local Events**
   - Post upcoming events in the locality.
   - Calendar view of neighborhood events.
   - Event reminders and RSVPs.

7. **Business Promotion**
   - Create business promotion posts within the locality.
   - Option for paid and unpaid promotion.

8. **Community Updates**
   - Post construction updates and infrastructure changes.
   - Report and track local issues.
   - Status updates on reported issues.

9. **Skill Exchange**
   - Profile section for listing skills.
   - Search for specific skills in the neighborhood.
   - Request and offer skill-based services.

10. **Volunteer Management**
    - Coordinate volunteer activities.
    - Direct communication channel with volunteers.

11. **Language Support**
    - Interface in multiple local languages.
    - Translation capabilities for posts.
    - Language preference settings.

12. **Location Services**
    - Set up meeting points for exchanges.
    - Map integration for precise meeting point fixing.

13. **Notification System**
    - Customizable notification preferences.
    - Push notifications for relevant updates.


## 3. Functional Requirements

### 3.1 User Management
| **ID** | **Requirement** | **Description** |
|--------|-----------------|-----------------|
| FR1 | Registration | Sign up via email with basic profile information. |
| FR2 | Verification | Optional ID scan for "Trusted Neighbor" badge. |
| FR3 | Profile Management | Edit profile details, interests, and skills. |
| FR4 | Language Settings | Set preferred language for interface and communications. |

### 3.2 Resource Sharing
| **ID** | **Requirement** | **Description** |
|--------|-----------------|-----------------|
| FR5 | Post Creation | Users can post requests/offers with photos, categories, and urgency levels. |
| FR6 | Search | Search by keyword, category, or distance (1–5 km). |
| FR7 | Emergency Broadcast | Critical posts trigger push alerts to users within 2 km. |
| FR8 | Resource Categories | Organize posts by categories (Medical, Tools, Books, etc.). |
| FR9 | Resource Timeline | Set availability duration for offered resources. |

### 3.3 Communication
| **ID** | **Requirement** | **Description** |
|--------|-----------------|-----------------|
| FR10 | In-App Chat | Encrypted messaging between users. |
| FR11 | Notifications | Push/SMS alerts for matches or messages. |
| FR12 | Message Translation | Translate messages between users' preferred languages. |
| FR13 | Group Messaging | Create group chats for community discussions. |

### 3.4 Events Management
| **ID** | **Requirement** | **Description** |
|--------|-----------------|-----------------|
| FR14 | Event Creation | Post community events with details, time, and location. |
| FR15 | Event Calendar | View events in calendar format with filters. |
| FR16 | Event Reminders | Get notifications for upcoming events. |
| FR17 | Event RSVP | Indicate attendance and see guest list. |

### 3.5 Business Promotion
| **ID** | **Requirement** | **Description** |
|--------|-----------------|-----------------|
| FR18 | Promotion Posts | Create special promotional offers for neighbors. |
| FR19 | Business Categories | Filter businesses by type of service. |

### 3.6 Community Updates
| **ID** | **Requirement** | **Description** |
|--------|-----------------|-----------------|
| FR20 | Issue Reporting | Report local issues with photos and descriptions. |
| FR21 | Infrastructure Updates | Post updates about construction or maintenance work. |
| FR22 | Status Tracking | Track status of reported issues (New, In Progress, Resolved). |

### 3.7 Skill Exchange
| **ID** | **Requirement** | **Description** |
|--------|-----------------|-----------------|
| FR23 | Skill Listing | Add skills to profile |
| FR24 | Skill Search | Find neighbors with specific skills. |
| FR25 | Skill Request | Request skill-based assistance from neighbors. |

### 3.8 Volunteer Management
| **ID** | **Requirement** | **Description** |
|--------|-----------------|-----------------|
| FR26 | Priority Communication | Direct channel between volunteers and those in need. |

### 3.9 Location Services
| **ID** | **Requirement** | **Description** |
|--------|-----------------|-----------------|
| FR27 | Meeting Setup | Coordinate meeting locations for exchanges. |

### 3.10 Notification System
| **ID** | **Requirement** | **Description** |
|--------|-----------------|-----------------|
| FR28 | Notification Preferences | Customize notification types and frequency. |
| FR29 | Push Notifications | Receive immediate alerts for important updates. |
| FR30 | In-app Notifications | View notification history within app. |

## 4. Non-Functional Requirements
| **Category** | **Requirement** |
|--------------|-----------------|
| **Performance** | Load search results within 2 seconds for 95% of queries. |
| | Process emergency alerts within 30 seconds of posting. |
| | Support concurrent usage of up to 1000 users per neighborhood. |
| **Security** | End-to-end encryption for chats; anonymize location data. |
| | Government ID verification with secure data storage compliant with local regulations. |
| | Regular security audits and vulnerability assessments. |
| **Usability** | 90% of test users can post a request within 3 minutes. |
| | Interface accessibility compliant with WCAG 2.1 AA standards. |
| | Support for local languages with complete translations. |
| **Compatibility** | Optimized for various screen sizes and resolutions. |
| **Reliability** | 99.9% uptime for core services. |
| | Automatic data backup every 24 hours. |
| | Disaster recovery plan with 2-hour recovery time objective. |
| **Scalability** | Ability to scale to 100+ users across multiple neighborhoods. |
| | Dynamic resource allocation based on user activity patterns. |
| **Maintainability** | Modular architecture for feature updates without system-wide impacts. |
| | Comprehensive logging for troubleshooting. |

## 5. System Architecture

### 5.1 High-Level Design
- **Frontend:** Fully responsive website.
- **Backend & Database:** Firebase (for real-time updates).
- **Cloud:** AWS S3 for image storage.
- **Push Notification Service:** Firebase Cloud Messaging.
- **Translation API:** Google Cloud Translation API.
- **Geolocation Service:** Integrated with OLA map APIs.

### 5.2 External Interfaces
- **Maps:** OLA Maps API for location filtering and navigation.

## 6. Use Case Diagrams

### 6.1 Primary Use Cases
1. **Post a Resource Request**
   - **Actor:** Resident
   - **Flow:** Post request → System notifies nearby users → Match found → Chat to coordinate pickup → Set meeting location → Complete exchange.

2. **Respond to Emergency Alert**
   - **Actor:** Resident
   - **Flow:** Receive SMS alert → View details → Accept/decline assistance → Coordinate through secure chat → Provide help.

3. **Organize Local Event**
   - **Actor:** Resident or Business Owner
   - **Flow:** Create event → Set details and location → Publish to neighborhood → Manage RSVPs → Send reminders → Host event.

4. **Report Local Issue**
   - **Actor:** Resident
   - **Flow:** Document issue with photo → Submit report → Neighbors can confirm/comment → Relevant authorities notified → Track resolution status.

5. **Offer Professional Skill**
   - **Actor:** Resident
   - **Flow:** Update profile with skill → Set availability → Neighbors search and find → Receive request → Negotiate terms → Provide service.

## 7. User Instructions

### 7.1 Getting Started
1. **Download and Install**
   - Access via web browser at https://main.d3raf20hzd0dfa.amplifyapp.com/

2. **Create Your Account**
   - Sign up using email address.
   - Complete your profile with basic information.

3. **Verify Your Identity (Optional but Recommended)**
   - Go to Profile > Verification.
   - Upload government-issued ID.
   - Receive "Trusted Neighbor" badge upon verification.

4. **Set Your Neighborhood**
   - Allow location access or manually enter your address.
   - Set your preferred radius (1-20 km).

### 7.2 Using Core Features

#### Sharing Resources
1. **Post a Resource**
   - Tap "+" button on home screen.
   - Select "Offer Resource" or "Request Resource."
   - Fill in details: title, description, category, duration available.
   - Add photos (optional but recommended).
   - Set urgency level if relevant.
   - Publish your post.

2. **Find Resources**
   - Use search bar with keywords.
   - Apply filters: category, distance, availability.
   - Browse the resource feed.
   - Save searches for regular needs.

3. **Emergency Requests**
   - Select "Emergency" when creating a request.
   - Provide critical details concisely.
   - Your request will be prioritized and sent as alerts.

#### Communication
1. **Messaging**
   - Tap on a post to express interest.
   - Use the in-app messaging to discuss details.
   - Share additional photos if needed.
   - Arrange meeting through the secure chat.

2. **Set Meeting Location**
   - Use "Suggest Meeting Point" feature in chat.
   - Select from safe public locations or suggest custom spot.
   - Confirm meeting time and location.
   - Get directions when needed.

#### Community Engagement
1. **Local Events**
   - Browse Events tab for neighborhood activities.
   - Create new events with details, time, location.
   - RSVP to events you're interested in.
   - Set reminders for upcoming events.

2. **Reporting Issues**
   - Go to Updates tab > Report Issue.
   - Categorize the issue (infrastructure, safety, etc.).
   - Add description and photos.
   - Track status of your reports.

3. **Business Promotion**
   - Create business profile through Settings.
   - Verify business credentials.
   - Post special offers for neighbors.
   - Respond to inquiries through business chat.

#### Skill Exchange
1. **Offering Skills**
   - Update profile with skills and expertise.
   - Set availability and terms.
   - Respond to skill requests.
   - Build reputation through reviews.

2. **Finding Skills**
   - Search by skill type in Skills tab.
   - View profiles and reviews of skilled neighbors.
   - Request assistance with specific projects.
   - Arrange details through messaging.

#### Volunteering
1. **Become a Volunteer**
   - Register through Volunteer tab.
   - Select areas of interest.
   - Set availability and radius.
   - Receive alerts for relevant needs.

2. **Request Volunteer Help**
   - Create request specifying need for volunteer.
   - Describe assistance needed.
   - System matches with available volunteers.
   - Coordinate through dedicated channel.

### 7.3 Settings and Preferences
1. **Notification Settings**
   - Customize by type: Resources, Events, Updates, Messages.
   - Set quiet hours.
   - Choose between push, email, or both.

2. **Privacy Controls**
   - Manage profile visibility.
   - Control location precision.
   - Set anonymous mode for sensitive requests.

3. **Language Preferences**
   - Select interface language.
   - Set translation preferences for communications.
   - Add secondary languages if multilingual.

## 8. Risks & Mitigation
| **Risk** | **Mitigation** |
|----------|----------------|
| Low adoption in neighborhoods. | Partner with local NGOs and community leaders for grassroots promotion. |
| Safety during exchanges. | Integrate **safe pickup zones** (e.g., local police stations) and in-app safety features. |
| Spam/fake requests. | Require phone verification for posting and implement community reporting system. |
| Privacy concerns. | Clear privacy policies, granular controls for users, and regular data handling audits. |
| Language barriers. | Robust translation features and culturally sensitive localization. |
| Digital divide. | Simple UI/UX with accessibility features and offline capabilities where possible. |
| Resource coordination failures. | Clear communication protocols and backup contact methods for critical exchanges. |

## 9. Glossary
- **Trusted Neighbor:** Verified user with ID proof.
- **Emergency Alert:** Priority broadcast for critical needs.
- **Safe Exchange Zone:** Designated public locations for resource exchanges.
- **Skill Exchange:** Service bartering system between neighbors.
- **Community Update:** Information about infrastructure changes or local issues.
- **Volunteer Network:** Connected group of residents offering assistance.

## 10. Next Steps
1. **Prioritize MVP Features:**
   - Core: Resource posting, search, in-app chat, emergency alerts.
   - Secondary: Events, business promotion, community updates.
   - Tertiary: Skill exchange, volunteer network, advanced location services.
2. **Wireframing:** Map user flows for all core and secondary features.
3. **Pilot Testing:** Launch in 1–2 neighborhoods to gather feedback.
4. **Phased Rollout:** Implement features in stages based on user adoption and feedback.
5. **Community Building:** Establish neighborhood ambassadors to promote usage.
