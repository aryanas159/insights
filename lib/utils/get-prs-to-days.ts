import differenceInDays from "date-fns/differenceInDays";

interface GraphData {
  x: number;
  y: number;
}

const getPullRequestsToDays = (pull_requests: DbRepoPREvents[], range = 30) => {
  const graphDays = pull_requests.reduce((days: { [name: string]: number }, curr: DbRepoPREvents) => {
    const day = differenceInDays(new Date(), new Date(curr.pr_updated_at));

    if (days[day]) {
      days[day]++;
    } else {
      days[day] = 1;
    }

    return days;
  }, {});

  const days: GraphData[] = [];

  for (let d = range; d >= 0; d--) {
    days.push({ x: d, y: graphDays[d] || 0 });
  }

  return days;
};

export default getPullRequestsToDays;
