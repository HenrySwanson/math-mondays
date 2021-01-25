Title: Linearity of Expectation
Date: 2018-10-15
Tags: probability

To introduce this topic, let's start with an innocuous problem:

> You have $10$ six-sided dice. If you roll all of them, what is the expected sum of the faces?

Your intuition should tell you that it's $35$. But what's really going on here is an example of a slick principle called **linearity of expectation**.

<!-- more -->

---

We're not actually computing the probability of getting $10, 11, \ldots, 60$, and summing it all up. Implicitly, we are making the following line of argument: the expected value of the first die is $3.5$, and so the expected value for $k$ dice is $3.5k$. This relies on the following claim: given two random variables $X$ and $Y$, the expected value of their sum, $E[X + Y]$, is just $E[X] + E[Y]$.

This feels intuitively true, and proving it is straightforward. Let $\Omega$ be the space of possible outcomes. Then
$$
\begin{align*}
E[X + Y] &= \sum_{\omega \in \Omega} p(\omega) (X + Y)(\omega) \\
&= \sum_{\omega \in \Omega} p(\omega) (X(\omega) + Y(\omega)) \\
&= \sum_{\omega \in \Omega} p(\omega) X(\omega) + \sum_{\omega \in \Omega} p(\omega) Y(\omega) \\
&= E[X] + E[Y]
\end{align*}
$$

But interestingly enough, at no point did we require $X$ and $Y$ be independent. This still works even when $X$ and $Y$ are correlated! For some sanity-checking examples, consider $X = Y$ and $X = -Y$.

This principle, which is rather obvious when $X$ and $Y$ are independent (so much so that we often use it unconsciously), is unexpectedly powerful when applied to dependent variables. We'll explore the concept through several example problems.


# Gumballs

> Imagine a very large gumball machine, with $4$ colors of gumballs in it, evenly distributed. We only have enough money for $6$ gumballs; what's the expected number of colors we will receive? Assume that the machine has so many gumballs that the ones we take out don't matter; effectively, we are drawing with replacement.

Let's compute this the naive way first. Let's count the number of ways we can get each number of colors, and do the appropriate weighted sum.

There are $4$ ways we can get only one color.

For any two colors, there's $2^6 = 32$ ways we can get gumballs using just those colors. There's $6$ pairs of colors, so there's $32 \cdot 6 = 192$ ways to get at most two colors. Subtracting off the single-color cases, we get $188$ ways to get exactly two colors.

Similarly, for any three colors, there's $3^6 = 729$ ways to get gumballs with just those colors. There's $4$ possible triplets, giving $2916$ ways to get at most three colors. Subtracting off the two-color cases, we get $2728$ ways to get exactly three colors.

All other cases have four colors: $4^6 - 2728 - 188 - 4 = 1176$ possible ways.

Now we do the weighted sum. Each possible sequence of gumballs has probability $1/4^6$ of occuring, so the expected value of the number of colors is:
$$ 1 \frac{4}{4^6} + 2 \frac{188}{4^6} + 3 \frac{2728}{4^6} + 4 \frac{1176}{4^6} = \frac{3317}{1024} \approx 3.239 $$

It's doable, but one can imagine this is much harder for larger numbers.

---

Let's take another go at it. For the $i$th color, define $X_i$ to be $1$ if we get at least one gumball of that color, and $0$ otherwise. The number of colors we get, $X$, is then the sum of the $X_i$.

The probability of *not* getting a gumball of a particular color on a particular draw is $3/4$, so the probability of not getting it in $6$ draws is $(3/4)^6$. This means that $E[X_i] = 1 - (3/4)^6 = 3367/4096$.

The $X_i$ are not independent; for example, if we know three of them are $0$, the last one must be $1$ (we must draw a gumball of **some** color). But we can still apply linearity of expectation, even to dependent variables.

Thus, the expected number of colors we get is $E[X] = \sum_{i = 1}^4 E[X_i] = 4 \cdot \frac{3367}{4096} = \frac{3367}{1024}$, just as we got earlier.

Notably, this approach extends gracefully to when we take $k$ gumballs with $n$ available colors. The expected value of each $X_i$ is then $(1 - 1/n)^k$, so the expected value of $X$ is then $n (1 - 1/n)^k$.

(This reveals an interesting approximation: if $n$ and $k$ are equal and large, then $(1 - 1/n)^n \approx 1/e$, so the expected number of colors is $n(1 - 1/e) \approx 0.63n$).


# Number of Fixed Points

These variables we saw earlier, that are $1$ if a condition is true, and $0$ otherwise, are called **indicator variables**, and they are particularly good candidates for linearity of expectation problems.

> After we shuffle a deck of $n$ cards, what are the expected number of cards that have stayed in the same position? Equivalently, given an arbitrary permutation on $n$ objects, how many fixed points does it have on average.

We have no interest in examining all $n!$ possible outcomes, and summing over the number of fixed points in each. That would be terrible. Instead, we're going to split our desired variable into several indicator variables, each of which is easier to analyze.

Let $X_k$ be $1$ if the $k$th card is in the $k$th position, and $0$ otherwise. Then the number of fixed points is $\sum_k X_k$.

After shuffling, the $k$th card is equally likely to be in any position in the deck. So the chance of ending up in the same place is $1/n$, which makes $E[X_k] = 1/n$. So by linearity of expectation, $E[X_1 + \cdots + X_n] = n \cdot \frac{1}{n} = 1$. So on average, one card will stay in the same place.


# Number of Cycles

We don't have to limit ourselves to indicator variables: sometimes we can use a constant factor to help us avoid overcounting.

> Given a random permutation on $n$ objects, how many cycles does it have?

As a reminder, the cycles of a permutation are the "connected components". For example, if $\sigma$ sends $1 \to 2$, $2 \to 4$, $3 \to 6$, $4 \to 1$, $5 \to 5$, and $6 \to 3$, then the cycles of $\sigma$ are $(1, 2, 4)$, $(3, 6)$, and $(5)$.

For each $k$, let $X_k = \frac{1}{L}$, where $L$ is the length of the cycle of $\sigma$ containing the number $k$. So for the permutation we described, $X_1 = X_2 = X_4 = 1/3$, $X_3 = X_6 = 1/2$, and $X_5 = 1$. Then the number of cycles is $X_1 + \cdots + X_n$, since each cycle contributes $L$ copies of $1/L$. As usual, these variables are highly dependent (if $X_i = 1/5$, there'd better be four other $X_j$ that equal $1/5$ as well), but we can still apply linearity of expectation.

The probability that $k$ is in a cycle of length $1$ is $1/n$, since $\sigma$ would have to send $k$ to itself.

The probability it is in a cycle of length $2$ is the probability $k$ is sent to some other number, times the probability that the other number is sent back to $k$, i.e. $\frac{n-1}{n} \cdot \frac{1}{n - 1}$, which is $\frac{1}{n}$.

In general, the probability of being in a cycle of length $L$ is $\frac{n-1}{n} \frac{n-2}{n-1} \cdots \frac{n-(L-1)}{n-(L-2)} \cdot \frac{1}{n-(L-1)} = \frac{1}{n}$. Curiously, this is independent of $L$.

So the expected value of $X_k$ is $\frac{1}{n} \sum_{L=1}^n \frac{1}{L} = \frac{H_n}{n}$, where $H_n$ is the $n$th [harmonic number](https://en.wikipedia.org/wiki/Harmonic_number). Then the expected number of cycles is $E[X_1] + \cdots + E[X_n] = H_n$.


# Buffon's Needle

We'll finish up with a rather surprising application to the Buffon's needle problem:

> Consider a gigantic piece of lined paper, with the lines spaced one unit apart. If we throw a needle of length $1$ onto the paper, what is the probability it crosses a line?

Technically, we're only interested in the probability that the needle crosses the line. But because it can cross at most once, this is equal to the expected number of crossings. So if we let $X_a$ be the expected number of crossings for a needle of length $a$, we're interested in $E[X_1]$.

Take a needle of length $a + b$, and paint it, covering the first $a$ units of it red, and the other $b$ units blue. Then throw it on the paper. The expected number of crossings is the expected number of red crossings, plus the expected number of blue crossings. But each segment of the needle is just a smaller needle, so the expected number of red crossings is $E[X_a]$, and the expected number of blue crossings is $E[X_b]$. This lets us conclude, unsurprisingly, that $E[X_{a+b}] = E[X_a] + E[X_b]$. This tells us that $E[X_a]$ is linear in $a$, and so $E[X_a] = Ca$ for some unknown constant $C$. (Well, we've gotta assume $X_a$ is continuous in $a$, which it is, but shh...)

Furthermore, put a sharp bend in the needle right at the color boundary. Each segment is still a linear needle, so the number of red crossings is still $E[X_a]$, and likewise with blue crossings. So the expected number of crossings for this bent needle is *still* $E[X_{a+b}]$, despite the kink!

By induction, if you put a finite number of sharp bends in a needle, it doesn't change the expected number of crossings. All that matters is the total length. And by <s>handwaving</s> a continuity argument, this is true for continuous bends as well. So $X_a$ doesn't just measure the expected number of crossings for a needle of length $a$, but any reasonable curve of length $a$. (Much to my delight, this phenomenon is called "Buffon's noodle".) This means that if we throw a rigid noodle of length $a$ on the paper, the expected number of crossings is $E[X_a] = Ca$.

So let's consider a particular kind of noodle: a circle with diameter $1$. No matter how it's thrown onto the paper, it will cross the lines exactly twice. It has circumference $\pi$, and so we can determine that $C = \frac{2}{\pi}$. Thus, for the original needle problem, $p = X_1 = \frac{2}{\pi}$.
