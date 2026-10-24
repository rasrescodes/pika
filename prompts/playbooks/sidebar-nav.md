sidebar-nav: a vertical nav or panel takes a full-height column.
- The sidebar is a large field: a full-height rect at its exact x and width in its own colour, plus its divider rule.
- Nav items stack: measure the first item's y and the pitch, then give each item its own y. One shared-style line holds them.
- The main area starts at the sidebar's right edge plus a margin: measure that x for every block in it.
- Logos and labels at the top and bottom of the sidebar count; place them exactly.
- Usual mistakes: sidebar width off by tens of px, a missing divider, main content measured from the page edge instead of the sidebar.
