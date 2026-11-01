# Farmer App: Mobile Design Brief

You are designing the screens of an existing, working mobile app. The app is built and every feature below works. Your job is the visual and interaction design, not the product scope. Do not add features, remove features, or change the rules in this brief. Where a screen needs something not listed, say so as a note instead of inventing it.

"Farmer App" is a working name. Don't design a logo around it.

## 1. What the app is

A marketplace in Kerala, India, where people buy fresh produce directly from local farmers.

- **Buyers** browse products, order today for delivery or pickup tomorrow, and pay the farmer in cash.
- **Farmers** apply to sell, and once approved they list products and manage their orders.
- One person has one account. A buyer becomes a farmer through an application, and keeps buying as well.
- There is no online payment, delivery tracking, chat, reviews, ratings, favourites, wallet, coupons or notifications. Don't design any of these.

## 2. Audience

- Indian households, on mid-range Android phones first and iPhones second.
- Farmers who may not be confident with apps. Farmer screens must be plain and hard to get wrong.
- Everything is in English for now. Prices are in rupees, for example ₹72 / kg.
- Text must stay readable outdoors in bright light, so keep contrast high and body text at 14 pt or larger.

## 3. Design goal

The owner wants the app to feel **classy, modern and attractive**: closer to a premium organic grocer than a discount delivery app. It should feel calm, warm and trustworthy, with fresh food as the hero. Avoid crowded layouts, loud banners, sale-style badges and generic template looks.

## 4. Current design

You may refine or replace this. If you replace it, give the full new system (section 11).

**Fonts:** Fraunces (serif, for headings, product names and large totals) and DM Sans (everything else).

| Colour role | Light | Dark |
|---|---|---|
| Background | #FAF7F0 | #0F1512 |
| Surface (cards) | #FFFFFF | #19211C |
| Muted element | #F0ECE1 | #232C26 |
| Border | #E9E3D6 | #2C362F |
| Text | #17211B | #F3F1E9 |
| Secondary text | #676F66 | #A8B0A5 |
| Primary | #17452F | #9AD0AE |
| Text on primary | #FFFFFF | #0E1C14 |
| Primary tint | #E5EDE3 | #21352A |
| Accent (gold) | #8C6A32 | #D9B872 |
| Bright gold | #D9B872 | #D9B872 |
| Accent tint | #F4ECDC | #352C1B |
| Danger / tint | #A8322A / #F9E7E3 | #F2A29B / #40201D |
| Warning / tint | #8F5C0B / #F8EDD8 | #F0B86A / #3D2C14 |
| Gradient panel start / end | #0E2A1E / #1F5A40 | #0C2219 / #1A4A36 |

**Spacing:** 4, 8, 16, 24, 32. **Corner radius:** 12, 16, 22, and full pill.

**Patterns in use:** a dark green diagonal gradient panel as the signature element, white cards with soft shadows, pill buttons, small gold uppercase labels, status pills, and a bottom tab bar with a tinted pill behind the active icon.

## 5. Technical limits

The app is React Native with Expo, and your design must be buildable with these.

- Icons come from **Ionicons** only. Name the icon you want, for example `leaf-outline`. Don't draw custom icons unless you provide them as SVG.
- Any Google Font can be used. Limit it to two families.
- Available effects: linear gradients, shadows, rounded corners, and images with cover or contain fit. Avoid blur, glass and mesh gradients, and complex animation. Android support for these is weak, and they need checking first.
- Light and dark mode are both required.
- Design for a 390 × 844 pt phone. It must also work at 360 pt wide, and long text must wrap or truncate gracefully.
- Minimum tap target is 44 × 44 pt.
- Keep the phone's status bar and home indicator areas clear.

## 6. Navigation

Four bottom tabs: **Browse, Cart, Orders, Account**. Cart shows a count badge when it has items.

Other screens open on top with a back arrow. Sign in opens as a modal. Screen titles are short.

```text
Browse → Product → Farm page → Product
Cart → Checkout → Orders
Orders → Order detail
Account → Saved addresses → Address form
Account → Become a farmer
Account → Farm orders → Order detail
Account → My products → Product form
Account → Farm details
Any action needing an account → Sign in
```

## 7. Screens

Keep every element listed. Layout, order and styling are yours to change unless a rule says otherwise.

### Everyone

**1. Browse (home)**
- Headline "Fresh from local farms" and line "Order today, get it tomorrow".
- Search field, placeholder "Search vegetables, fruit, milk…".
- Horizontal filter chips: Near me (uses location, shows a spinner while locating), All, then one per category.
- Two-column product grid, loads more on scroll, pull to refresh.
- Product card: photo, category, product name, farm name, distance if Near me is on (for example 4.2 km), price and unit, and an "Out of stock" badge when stock is 0.
- States: loading; error with Try again; no results ("No products found." or "Nothing found within 50 km of you."); location error message under the chips.

**2. Product**
- Large photo at the top, category, name, price and unit, stock such as "199 kg available" or "Out of stock", optional description.
- Farm card with name and location, which opens the farm page.
- Fixed bottom bar with quantity stepper and "Add to cart". Signed out, the button reads "Sign in to buy". The bar is hidden when out of stock.
- After adding: confirmation "Added to your cart". Errors appear in the bar.

**3. Farm page**
- Header with farm name and location, then that farm's product grid.
- Empty: "This farm has no products listed right now."

**4. Sign in** (three steps on one screen)
- Phone: "Welcome", "Sign in with your mobile number to order from local farmers.", mobile number field, Continue.
- New users only: "New here? Tell us who you are.", name, email, Send code.
- Code: "Enter the 6-digit code sent to +91…", code field, Verify, Send a new code.
- Show notices and errors. There are no passwords and no social login.

### Buyer

**5. Cart**
- List of items: name, farm, unit price, line total, quantity stepper, Remove.
- An item may show a problem: "No longer available", "Only 3 kg left", "Out of stock", "Price changed from ₹60". Some problems add a fix button: "Accept price" or "Change to 3".
- Fixed footer: Total and Checkout. Checkout is disabled if any item has a problem, with "Fix the items above to check out."
- States: signed out ("Sign in to see your cart" with a Sign in button); empty ("Your cart is empty.").
- Cart items have no photos in the current data. Tell us if your design needs them.

**6. Checkout** (one scrolling page)
- How do you want it? Delivery or Pick up from the farm.
- Delivery: list of saved addresses to choose from, and Add a new address.
- Pickup: each farm's pickup address, or "pickup is not available from this farm".
- Time on (date): time slots such as 7–9 AM, 9–11 AM, 4–6 PM, 6–8 PM. One must be chosen.
- Your order: items, total, "Payment: cash on delivery", contact name and phone.
- If the cart spans several farms: "This becomes 2 orders, one for each farm."
- If ordering has closed: "Ordering for tomorrow closed at 21:00. It reopens at midnight." The hour is an example and comes from the server.
- Place order. Afterwards, a confirmation "Order placed. Pay the farmer in cash." and the Orders tab.

**7. Orders**
- List: farm name, total, delivery date and slot, item count, status pill. Pull to refresh.
- Status: Waiting for the farmer (amber), Confirmed (green), Completed (neutral), Cancelled (red).
- States: signed out; empty ("You haven't ordered anything yet.").

**8. Order detail** (shared by buyer and farmer)
- Farm name and status, cancellation reason if any.
- "Delivery on Mon, 2 Nov, 9–11 AM" or Pickup, with address and contact.
- Items, total, "Payment: cash on delivery".
- Buyer: Cancel order while it's waiting for the farmer, with a confirmation.
- Farmer: "New order" replaces the waiting label. Confirm order, then Mark as completed. Cancel order with an optional reason shown to the buyer.

**9. Account**
- Name, phone, email, initial avatar.
- Status pill: Farmer application under review, Approved farmer, or Farmer application not approved, with the reason.
- Not a farmer: invitation card "Become a farmer". Rejected: "Apply again".
- Approved farmer: a Your farm group with Farm orders, My products, Farm details.
- Your account group: Saved addresses, Sign out.

**10. Saved addresses**
- Cards: label, default marker, address, Make default, Edit, Delete (with confirmation). Add an address button.
- Empty: "No saved addresses yet."

**11. Address form**
- House / street, Area or landmark (optional), City, Pincode (6 digits), Label such as Home (optional), Save address.

### Farmer

**12. Become a farmer**
- Intro: "Sell from your farm", "Reach buyers near you. They order today for tomorrow and pay you in cash."
- How it works: 1 Tell us about your farm, 2 We review your application, 3 List your products.
- Farm name, Farm address (shown to buyers who pick up).
- Farm location: a button that uses the phone's current location. There is no map. Hint: "Do this while you are at your farm, so nearby buyers can find you." After setting, it shows the coordinates and "Use my location again".
- Send application, disabled until all are filled.

**13. Farm orders**
- Today / Tomorrow switch, defaulting to Tomorrow.
- List: buyer name, slot, Delivery or Pickup, total, status pill. Opens Order detail.
- Empty: "No orders for tomorrow."

**14. My products**
- List: small photo, name, price and unit, stock left, and a status if any: "Paused", "Out of stock", or "Hidden by admin: (reason)". Add a product button.
- Empty: "You haven't listed anything yet."

**15. Product form** (new and edit)
- Name, Description (optional), Price in ₹, Sold per (for example kg), Stock, Category chips.
- Edit only: "Show to buyers" switch.
- Declaration: legal text from the server and a required "I accept this declaration" checkbox. It appears when name, description, price, unit or category changes, and for every new product. Changing only stock or the switch doesn't need it.
- Save.
- Photos at the end of the form (up to 5, shown as "2 of 5") with remove on each, Choose a photo, Take a photo.
- Edit only: Delete product, with confirmation "Buyers will no longer see it. Past orders are kept."
- Photos are chosen at the end of the form and upload when the product is saved.

**16. Farm details**
- Farm name (read only), Farm address, Farm location (same as screen 12), Save.

## 8. States every screen needs

- **Loading**, **error with Try again**, and **empty** where the screen has a list.
- **Disabled** and **busy** versions of the primary button.
- **Inline error** text near the action that failed.
- Design shared versions of these once. You don't need to repeat them for each screen.

## 9. Components to design

Primary and text buttons; text field (normal, focused, error); product card; list card; menu row; section heading; status pill in four tones; filter chip; radio option card; quantity stepper; checkbox; switch; tab bar with badge; screen header; gradient panel; fixed bottom action bar; empty state.

## 10. Sample content

Use this, not lorem ipsum.

- Products: Matta Rice ₹72 / kg, Fresh Milk ₹56 / litre, Banana ₹60 / dozen, Spinach ₹30 / bunch.
- Categories: Dairy, Fruits, Grains, Vegetables.
- Farms: Sample Green Farm (Thrissur, Kerala), Test Valley Farm (Ollur, Thrissur West).
- Address: 12 Main Road, Thrissur, 680001.

**Product photos matter most here.** The app has no real photos yet, so listings without one show a soft tinted tile with a category icon. Design that fallback so it looks intentional. Show cards both ways, with a real photo and with the fallback, and make sure both work. Sellers will upload ordinary phone photos of mixed quality, so the layout must look good with them.

## 11. What to deliver

Return all of the following so a developer can build it exactly.

1. **Design system:** every colour for light and dark mode as hex, using the roles in section 4 and any new ones; font families, with size, line height, weight and letter spacing for each text style; spacing; corner radii; shadows.
2. **Screens:** all 16 screens in light mode, plus at least Browse, Product and Account in dark mode.
3. **States:** the shared states from section 8.
4. **Components:** each one from section 9, with sizes and padding in points.
5. **Icons:** the Ionicons name for every icon used.
6. **Notes:** anything you changed from this brief, and why.

Export as PNG images at 2× or larger, or as a shared Figma link with Dev Mode access, or as HTML and CSS. Give values as numbers, not descriptions like "soft shadow".
