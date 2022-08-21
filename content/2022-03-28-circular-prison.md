Title: Circular Prison of Unknown Size
Date: 2022-03-28
Tags: interactive, puzzles

{% import 'macros.html' as macros %}

A popular kind of mathematical puzzles is "prisoner puzzles", in which a large group of cooperative players ("prisoners") play a game against an adversarial supervisor (often "the warden"), with limited communication. Some classic examples are [here](https://en.wikipedia.org/wiki/100_prisoners_problem) and [here](https://www.popularmechanics.com/science/math/a25254/riddle-of-the-week-16/) (there's frequent overlap with "hat problems").

Recently, I ran across a [very difficult prisoner puzzle](https://puzzling.stackexchange.com/questions/16168/the-circular-prison-of-unknown-size), which required an intricate solution from the prisoners to win. I've rephrased the problem and a few solutions below, along with an interactive demonstration of the strategies.

> The inevitable has happened -- all the mathematicians in the world have been gathered up and arrested for being huge nerds.
> 
> The mathematicians are housed in a custom prison, which has $n$ identical, isolated cells, arranged in a large circle, each containing a single occupant (no empty cells). Inside each cell is a light switch and a light bulb, but the electrical wiring is unusual. If the light switch in a cell is on at noon, the bulb in the *adjacent* cell will briefly flash. Otherwise, and at all other times, the light bulb is off[ref]Essentially, every prisoner gets to send a bit to the cell next door. The noon thing is just to rule out prisoners trying to send multiple signals.[/ref].
>
> In order to prevent communication, every midnight, the warden fills the cells with knockout gas, flips all the switches to "off", and rearranges the prisoners however he wants. (Still only one prisoner per cell though.)
>
> One day, the warden enters your cell and issues you a challenge to win your freedom, and that of your colleagues. At any point, any one of the prisoners can announce "There are $n$ prisoners!". If they are correct, then everyone is free. Otherwise, everyone will be executed. He allows you to send a message to all of your colleagues, describing the game and the plan, to which they are not allowed to reply. The warden, of course, will read your message, and shuffle everyone to thwart your strategy.
>
> What plan would you devise?

<!-- more -->
---

The StackExchange link above describes a few solutions, and there are two in particular that I think are particularly interesting. In all cases, it's important that you are singled out by the warden, because this breaks the symmetry between you and everyone else, and allows you to act as the *captain* for the group.

# Upper Bound

For both strategies, the first step is to establish an upper bound, which can be done as follows:

* We perform a sequence of *rounds*, i.e., Round 1, Round 2, etc., consisting of a *waxing phase* and a *waning phase*.
* Within each round, prisoners are either "active" (will flip their switch today) or "inactive" (will not).
* The waxing phase of round $k$ lasts for $k$ days:
    * At the start of this round, the captain starts off active, and everyone else starts inactive.
    * During this phase, anyone who sees a light becomes active, and stays that way for the rest of the phase.
* The waning phase of round $k$ lasts for $2^k$ days:
    * At the start of this phase, prisoners carry over their active status from the end of the waxing phase.
    * If a prisoner does not see a light, they immediately become inactive and remain that way for the rest of the phase.

We claim that, at the end of a round, either everyone is active or everyone is inactive. If no one does, we move on to the next round, otherwise, we stop, and claim that $n \le 2^k$.

Consider the number of active prisoners at the end of the waxing phase. Because each prisoner can activate only one other prisoner per day, the number of active prisoners can at most double each day. This means that, at the end of the waxing phase, there are at most $2^k$ active prisoners.

Now, if everyone is active, the waning phase consists of everyone flipping the switch every day, and the round ends with everyone still active. Otherwise, some inactive prisoner border some active prisoner, and the number of active prisoners decreases by at least one per day. Since we started the phase with at most $2^k$ active prisoners, after $2^k$ days, everyone will be inactive.

Note: this process must eventually terminate, because during the $k$th round, there are at least $k$ active prisoners at the end of the waxing phase, and so, worst case scenario, we'll finish at round $n$.

# Solution by Flipping Coins

At this point, the solutions take different approaches. One of the solutions, given in [this answer](https://puzzling.stackexchange.com/a/16206/78405), relies on giving the prisoners the ability to flip coins, allowing them to make decisions that the warden can't predict ahead of time.

In order to communicate the results of these coin flips, we build an "announcement" subprocedure.

{% call macros.theorem_box("Announcements") %}
For a predicate $P$, an *announcement* for $P$ is a procedure that makes it common knowledge whether there exists some prisoner satisfying $P$.

<br>
The announcement period lasts $B$ days, where $B$ is an upper bound for the number of prisoners.

* Every prisoner satisfying $P$ is always active (and always flips the switch).
* Other prisoners become active when they see a light, and remain active afterwards, much like the waxing phase.

At the end of the announcement period, if someone satisfied $P$, everyone is active, otherwise everyone is inactive. This makes the (non-)satisfaction of $P$ common knowledge.
{% endcall %}

Now we can describe the strategy. The goal is to assign each prisoner a number from $1$ to $n$. At each point, the numbers $1$ through $d$ will be assigned, and $d$ is common knowledge. The captain starts out numbered $1$, and everyone else starts off unnumbered (i.e., $d = 1$).

Then, they repeat the following procedure:

* ($B$ Days) Perform an announcement for "is unnumbered".
    * If we get a negative result, then everyone is numbered, and everyone knows $n$.
    * Otherwise, proceed.
* ($1$ Day) Candidate Selection Day
    * This day is the crucial day of the strategy.
    * Every numbered prisoner simultaneously flips a coin. If they flip heads, they flip the switch today, otherwise they don't.
    * Unnumbered prisoners do not flip the switch today.
    * Prisoners who see a light today are called *candidates*.
* ($d \cdot B$ Days) For each $i$ from $1$ to $d$, the prisoner numbered $i$ makes an announcement for "flipped heads".
    * After this, everyone knows exactly how many heads were flipped, i.e., how many candidates there are.
* ($B$ Days) Finally, an announcement is made for "is unnumbered candidate".
    * If this announcement is positive, and exactly one head was flipped, then there is a unique unnumbered candidate, and so they should assign themselves the number $d+1$, and everyone increments $d$.

Repeated enough times, this procedure will eventually[ref]As in, [almost surely](https://en.wikipedia.org/wiki/Almost_surely).[/ref] complete. Imagine that we've numbered all but one prisoner. In order to number the last prisoner, every numbered prisoner needs to flip tails, except the one adjacent to the unnumbered one. This is unlikely to happen, but it will eventually occur. The same is also true of all prior attempts to number a prisoner.

Also, the warden can rearrange the prisoners how he wishes, but because every numbered prisoner is equally capable of nominating a candidate, his efforts cannot actually impede the procedure.

---

To see how this algorithm plays out in practice, here is an interactive simulation. The coins are weighted to come up heads $1/d$ of the time, which I think is optimal.

The prisoners are named $A$ through $E$, but this is just so that you can track their identities between shuffles. Their numbered labels are in the lower left, the coins they flip are in the lower right, and their candidacy status is in the upper right.

<!-- TODO: generate prisoner graphics legend automatically -->

<div>
<span id="day-counter-1"></span>
  <div style="float: right;">
    <button id="start-over-button-1" type="button">Start Over</button>
    <button id="undo-button-1" type="button">Undo</button>
    <button id="next-button-1" type="button">Next</button>
    <button id="finish-phase-button-1" type="button">Finish Phase</button>
  </div>
</div>

<div><span id="state-description-1"></span></div>

<div id="prison-interactive-1" style="border-style: solid;border-width: 3px;border-radius: 5px;background-color: #fff"></div>

<div><span id="common-knowledge-1"></span></div>

# Solution by Linear Algebra

The other approach (described [here](https://puzzling.stackexchange.com/a/24791/78405) and [here](https://puzzling.stackexchange.com/a/24734/78405)) is more complicated, but does not use randomness, and is guaranteed to finish in a certain number of days. It also leverages some linear algebra, so it's a good thing our prisoners are mathematicians!

It begins the same way as the first solution, by establishing an upper bound $B$, and it uses the same announcement procedure. But instead of numbering individual prisoners, the goal is to partition them into subsets, and, after a certain point, deduce the size of these subsets.

Confused? Me too. It only really clicked for me after writing out this section.

At each point, there will be a partition of prisoners into subsets $S_1, \ldots, S_k$; the prisoners will all know $k$, and which subset they themselves are in. The sets are initialized with you, the captain, in $S_1$, and everyone else in $S_2$.

To refine this partition further, they attempt the following procedure repeatedly:

* For each subset $I \subseteq \{1, 2, \ldots, k\}$, other than the empty set and the whole set,
    * ($1$ Day) All prisoners in $\bigcup_{i \in I} S_i$ flash their lights today. Let $T$ be the set of prisoners that see lights today.
    * For each individual $j = 1, 2, \ldots, k$, check how $T$ and $S_j$ overlap:
        * ($B$ Days) Perform an announcement for prisoners in $S_j \cap T$
        * ($B$ Days) Perform an announcement for prisoners in $S_j \setminus T$
        * If both announcements were positive, replace $S_j$ with $S_j \cap T$, and add $S_j \setminus T$ as a new set, incrementing $k$. Then, abort this procedure and try again.
    * Basically, $T$ is used to "cut" an $S_j$ into two smaller subsets, if possible.
* If we get to this point, stop. We claim it is now possible to announce the correct number of mathematicians.

The loop must eventually stop, because in the worst case, $k = n$ and all subsets are size one. We can even put an upper bound on how long it will take. We can run the procedure at most $n-2$ times before all our subsets are size one. If we delay the splitting as long as possible, we'll have to go through $2^n$-ish subsets, each of which takes $2B+1$ days. Since the worst case for our upper bound is $B = 2^n$, this gives $(n-2)2^n(2\cdot 2^n+1) \approx 2n^2 \cdot 4^n$ days.

---

But how does this help them calculate $n$?

Fix one of the subsets $I$. Because $k$ did not increase on the final attempt, we know $T$ was not able to cut any of the $S_j$ this time. In other words, for all $j$, either every prisoner in $S_j$ saw a light, or none of them did. Let $I'$ be the set of $j$ such that prisoners in $S_j$ saw lights. Since the number of prisoners seeing a light must equal the number of prisoners flipping a switch, this gives us an equation:

$$ \sum_{i \in I} |S_i| = \sum_{j \in I'} |S_j| $$

Note that $I'$ cannot be a subset of $I$. The circular nature of the prison means that, unless $I$ is the whole set or the empty set, there must be someone outside of $I$ that saw a light, and we excluded those subsets from the procedure.

So, letting $x_i$ be the size of $S_i$, we now have a system of equations about the variables $x_1, \ldots, x_k$. Importantly, the prisoners know these equations as well! Because of the announcements made when attempting to cut with $T$, the prisoners know whether $S_j \cap T$ or $S_j \setminus T$ is empty or not, and this tells them the contents of $I'$. (They already know $I$ because they agree on the order of iteration.) Lastly, they know that $S_1$ is just the captain, and so $x_1 = 1$.

We claim that, under these constraints, there is exactly one possible solution, and once the prisoners find it, they know the size of every subset exactly. They can win by simply guessing that $n = \sum x_i$.

*Proof*:

Let $x_1, \ldots, x_k$ and $y_1, \ldots, y_k$ be two such solutions. Let $r$ be the minimum value of $y_i/x_i$ over all $i$, and let $z_i = y_i - r x_i$. We note three things:

* Each $z_i \ge 0$, because $r \le y_i/x_i$
* At least one $z_i = 0$, because there is some $i$ for which $r = y_i/x_i$
* As a linear combination of solutions, the $z_i$ are also a solution

Assume for the sake of contradiction that some of the $z_i$ are non-zero. Let $Z$ be the set of $i$ for which $z_i = 0$, which is by our assumption, not the whole set. Consider the equation corresponding to that subset; there is some subset $Z' \not\subseteq Z$ such that:

$$ \sum_{i \in Z} z_i = \sum_{j \in Z'} z_j $$

The left hand side must be zero, by definition, but because $Z' \setminus Z$ is non-empty, there is some non-zero $z_j$ on the right hand side. All the $z_j$s are non-negative, so we have reached a contradiction. Thus, all $z_i$ are zero, meaning that $y_i = r x_i$. And because $x_1 = y_1 = 1$, this forces $r$ to be $1$, and so the two solutions are identical.

---

This approach is simulated below, but with one minor caveat. Once the system of equations has a unique solution, the mathematicians will just blurt it out immediately, instead of waiting for all $2^n - 2$ equations to come in.

Note: Experimentally, it seems that it's extremely common for the prisoners to all get partitioned into sets of size $1$, but that's not necessarily the case every time. If you were able to rearrange the prisoners as you wished, you could set up such a situation: once you have $4$ partitions, you can ensure that partition $4$ is never split up.

But I haven't yet added the ability to drag-and-drop prisoners around, so you have to approximate this by just hitting "Undo" and "Next" until you get the result you want. Maybe I'll add that once I stop seething at JavaScript.

<div>
<span id="day-counter-2"></span>
  <div style="float: right;">
    <button id="start-over-button-2" type="button">Start Over</button>
    <button id="undo-button-2" type="button">Undo</button>
    <button id="next-button-2" type="button">Next</button>
    <button id="finish-phase-button-2" type="button">Finish Phase</button>
  </div>
</div>

<div><span id="state-description-2"></span></div>

<div id="prison-interactive-2" style="border-style: solid;border-width: 3px;border-radius: 5px;background-color: #fff"></div>

<div><span id="common-knowledge-2"></span></div>

<script src="https://cdn.jsdelivr.net/npm/@svgdotjs/svg.js@3.0/dist/svg.min.js"></script>
<script src="/js/circular_prison.js"></script>
