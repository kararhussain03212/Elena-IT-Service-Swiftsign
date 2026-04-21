const toOrderValue = (item) => {
    const raw = item?.order ?? item?.sortOrder ?? item?.sort_order;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return Number.POSITIVE_INFINITY;
    }
    return parsed;
};

const toCreatedTime = (item) => {
    const raw = item?.createdAt ?? item?.created_at;
    if (!raw) return Number.POSITIVE_INFINITY;
    const parsed = new Date(raw).getTime();
    return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
};

const toStableId = (item) => String(item?._id ?? item?.id ?? "");

export const sortContentItems = (items) => {
    const list = Array.isArray(items) ? [...items] : [];

    return list.sort((left, right) => {
        const orderDiff = toOrderValue(left) - toOrderValue(right);
        if (orderDiff !== 0) return orderDiff;

        const createdDiff = toCreatedTime(left) - toCreatedTime(right);
        if (createdDiff !== 0) return createdDiff;

        return toStableId(left).localeCompare(toStableId(right));
    });
};
