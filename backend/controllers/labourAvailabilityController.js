import LabourAvailability from '../models/labourAvailability.js';
import Category from '../models/category.js';
import User from '../models/user.js';

const addLabourList = async (req, res) => {
	try {
		const { categories = [] } = req.body;

		if (!Array.isArray(categories)) {
			return res.status(400).json({ message: 'Categories must be an array.' });
		}
		if (!categories.length || categories.some(category => !category.categoryId)) {
			return res.status(400).json({ message: 'At least one valid category is required.' });
		}

		const categoryIds = categories.map(category => category.categoryId);
		const categoryCount = await Category.countDocuments({ _id: { $in: categoryIds } });

		if (categoryCount !== categoryIds.length) {
			return res.status(400).json({ message: 'One or more categories are invalid.' });
		}

		const provider = await User.findById(req.user).select('location');
		const hasListingLocation = req.body.location?.type === 'Point'
			&& Array.isArray(req.body.location.coordinates)
			&& req.body.location.coordinates.length === 2;
		const providerLocation = provider?.location?.type === 'Point'
			&& Array.isArray(provider.location.coordinates)
			&& provider.location.coordinates.length === 2
			? { type: 'Point', coordinates: [...provider.location.coordinates] }
			: undefined;

		const labourList = await LabourAvailability.create({
			...req.body,
			...(hasListingLocation ? {} : providerLocation ? { location: providerLocation } : {}),
			providerId: req.user
		});

		return res.status(201).json({
			message: 'Labour list created successfully.',
			labourList
		});
	} catch (error) {
		return res.status(400).json({
			message: 'Unable to create labour list.',
			error: error.message
		});
	}
};

const addCategory = async (req, res) => {
	try {
		const { categoryName } = req.body;
		const category = await Category.create({ categoryName });

		return res.status(200).json({
			message: 'Category added successfully.',
			category
		});
	} catch (error) {
		return res.status(400).json({
			message: 'Unable to add category.',
			error: error.message
		});
	}
};

const getCategory = async (req, res) => {
	try {
		const categories = await Category.find();

		return res.status(200).json({ categories });
	} catch (error) {
		return res.status(500).json({
			message: 'Unable to fetch categories.',
			error: error.message
		});
	}
};

const getLabourList = async (req, res) => {
	try {
		const user = await User.findById(req.user).select('location role');
		if (!user) {
			return res.status(404).json({ message: 'User not found.' });
		}

		if (user.role !== 'Seeker') {
			return res.status(403).json({ message: 'Only seekers can search labour listings.' });
		}

		if (!user || !user.location || !user.location.coordinates) {
			return res.status(400).json({ message: 'User location is not configured.' });
		}

		const radius = Number(req.query.radius || 10);
		const { gender, categoryId } = req.query;
		const minPrice = req.query.minPrice === undefined ? undefined : Number(req.query.minPrice);
		const maxPrice = req.query.maxPrice === undefined ? undefined : Number(req.query.maxPrice);

		if (!Number.isFinite(radius) || radius <= 0) {
			return res.status(400).json({ message: 'Radius must be a positive number.' });
		}

		if (gender && !['male', 'female'].includes(gender)) {
			return res.status(400).json({ message: 'Gender must be male or female.' });
		}

		if (minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) {
			return res.status(400).json({ message: 'Minimum price is invalid.' });
		}

		if (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) {
			return res.status(400).json({ message: 'Maximum price is invalid.' });
		}

		if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
			return res.status(400).json({ message: 'Minimum price cannot exceed maximum price.' });
		}

		const filter = {
			location: {
				$near: {
					$geometry: user.location,
					$maxDistance: radius * 1000
				}
			}
		};

		if (gender) {
			filter[`gender.${gender}`] = { $gt: 0 };
		}

		if (categoryId || minPrice !== undefined || maxPrice !== undefined) {
			const categoryFilter = {};
			if (categoryId) categoryFilter.categoryId = categoryId;
			if (minPrice !== undefined || maxPrice !== undefined) {
				categoryFilter.priceRate = {};
				if (minPrice !== undefined) categoryFilter.priceRate.$gte = minPrice;
				if (maxPrice !== undefined) categoryFilter.priceRate.$lte = maxPrice;
			}
			filter.categories = { $elemMatch: categoryFilter };
		}

		const labourLists = await LabourAvailability.find(filter)
			.populate('providerId', '-password')
			.populate('categories.categoryId')
			.sort({ createdAt: -1 });

		return res.status(200).json({ labourLists });
	} catch (error) {
		return res.status(500).json({
			message: 'Unable to fetch labour lists.',
			error: error.message
		});
	}
};

const getProviderListings = async (req, res) => {
    try {
        const provider = await User.findById(req.user).select('location');
        const providerLocation = provider?.location?.type === 'Point'
            && Array.isArray(provider.location.coordinates)
            && provider.location.coordinates.length === 2
            ? { type: 'Point', coordinates: [...provider.location.coordinates] }
            : undefined;

        if (providerLocation) {
            await LabourAvailability.updateMany(
                {
                    providerId: req.user,
                    $or: [
                        { location: null },
                        { 'location.coordinates': { $exists: false } }
                    ]
                },
                { $set: { location: providerLocation } }
            );
        }

        const labourLists = await LabourAvailability.find({ providerId: req.user })
            .populate('categories.categoryId')
            .sort({ createdAt: -1 });
        return res.status(200).json({ labourLists });
    } catch (error) {
        return res.status(500).json({ message: 'Unable to fetch your listings.', error: error.message });
    }
};

const updateLabourList = async (req, res) => {
    try {
        const listing = await LabourAvailability.findOneAndUpdate(
            { _id: req.params.listingId, providerId: req.user },
            req.body,
            { new: true, runValidators: true }
        );
        if (!listing) return res.status(404).json({ message: 'Listing not found.' });
        return res.status(200).json({ message: 'Listing updated successfully.', labourList: listing });
    } catch (error) {
        return res.status(400).json({ message: 'Unable to update listing.', error: error.message });
    }
};

const deleteLabourList = async (req, res) => {
    try {
        const listing = await LabourAvailability.findOneAndDelete({ _id: req.params.listingId, providerId: req.user });
        if (!listing) return res.status(404).json({ message: 'Listing not found.' });
        return res.status(200).json({ message: 'Listing deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ message: 'Unable to delete listing.', error: error.message });
    }
};

export default { addLabourList, addCategory, getCategory, getLabourList, getProviderListings, updateLabourList, deleteLabourList };
